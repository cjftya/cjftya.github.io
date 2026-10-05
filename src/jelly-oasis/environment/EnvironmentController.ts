import {
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  SRGBColorSpace,
} from 'three';
import type { PerspectiveCamera, Scene } from 'three';
import { createClouds } from './createClouds';
import { createRain } from './createRain';
import { createSky } from './createSky';
import { advanceTime, createTimeFrame, sampleTime, wrapTime } from './timeOfDay';
import { blendWeather, ENVIRONMENT_CONFIG, WEATHER_PROFILES } from './weather';
import type { EnvironmentState, WeatherPreset, WeatherProfile } from './weather';

export class EnvironmentController {
  readonly state: EnvironmentState;
  readonly root = new Group();
  readonly sky = createSky();
  readonly clouds = createClouds();
  readonly rain: ReturnType<typeof createRain>;
  readonly sun = new DirectionalLight('#fff0d0', 2.5);
  readonly moon = new DirectionalLight('#a5bbed', 0.5);
  readonly ambient = new HemisphereLight('#f2edd6', '#61715c', 1.65);
  readonly fog = new Fog('#dce7d6', 250, 900);
  readonly profile: WeatherProfile = { ...WEATHER_PROFILES.CLEAR };
  readonly config = { ...ENVIRONMENT_CONFIG };
  fogEnabled = true;
  cloudsEnabled = true;
  private readonly from: WeatherProfile = { ...WEATHER_PROFILES.CLEAR };
  private readonly timeFrame = createTimeFrame();
  private readonly overcastZenith = new Color('#85949f');
  private readonly overcastHorizon = new Color('#bac5c0');
  private readonly dayAmbient = new Color('#f2edd6');
  private readonly nightAmbient = new Color('#afc2e9');
  private readonly dayGround = new Color('#687359');
  private readonly nightGround = new Color('#5f698e');
  private readonly cloudDay = new Color('#fff3de');
  private readonly cloudNight = new Color('#818cab');
  private readonly cloudStorm = new Color('#727f8d');
  private elapsed = 0;
  private cloudAge = Infinity;
  private changed = true;

  constructor(
    private readonly scene: Scene,
    mobile: boolean,
    reducedMotion: boolean,
  ) {
    this.state = {
      timeOfDay: 10,
      weather: 'CLEAR',
      weatherBlend: 1,
      playing: !reducedMotion,
      speed: 1,
    };
    this.rain = createRain(
      mobile ? this.config.mobileRainCount : this.config.desktopRainCount,
    );
    this.root.name = 'OasisEnvironment';
    this.root.add(
      this.sky.group,
      this.clouds.mesh,
      this.rain.mesh,
      this.sun,
      this.sun.target,
      this.moon,
      this.ambient,
    );
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -180,
      right: 180,
      top: 180,
      bottom: -180,
      near: 10,
      far: 700,
    });
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.normalBias = 0.4;
    this.sun.shadow.bias = -0.0002;
    this.moon.position.set(100, 180, 80);
    scene.add(this.root);
    scene.fog = this.fog;
  }
  setTime(hour: number): void {
    this.state.timeOfDay = wrapTime(hour);
    this.changed = true;
  }
  setPlaying(value: boolean): void {
    this.state.playing = value;
    this.changed = true;
  }
  setSpeed(value: number): void {
    this.state.speed = Number.isFinite(value) ? Math.max(0, Math.min(20, value)) : 1;
  }
  setWeather(weather: WeatherPreset): void {
    if (!(weather in WEATHER_PROFILES) || weather === this.state.weather) return;
    Object.assign(this.from, this.profile);
    this.state.weather = weather;
    this.state.weatherBlend = 0;
    this.changed = true;
  }
  get animated(): boolean {
    return this.state.playing || this.state.weatherBlend < 1;
  }
  invalidate(): void {
    this.changed = true;
  }

  update(
    seconds: number,
    camera: PerspectiveCamera,
    distance: number,
    pixelRatio: number,
  ): boolean {
    const dt = Number.isFinite(seconds) ? Math.min(0.1, Math.max(0, seconds)) : 0;
    const advancing = this.state.playing && dt > 0;
    const transitioning = this.state.weatherBlend < 1;
    if (advancing) {
      this.state.timeOfDay = advanceTime(
        this.state.timeOfDay,
        dt,
        this.config.cycleSeconds,
        this.state.speed,
      );
      this.elapsed += dt;
    }
    if (transitioning) {
      const duration = this.config.transitionSeconds;
      this.state.weatherBlend = Math.min(
        1,
        this.state.weatherBlend +
          (Number.isFinite(duration) && duration > 0 ? dt / duration : 1),
      );
      blendWeather(
        this.from,
        WEATHER_PROFILES[this.state.weather],
        this.state.weatherBlend,
        this.profile,
      );
    }
    this.sky.group.position.copy(camera.position);
    this.rain.mesh.position.copy(camera.position);
    this.sky.starMaterial.uniforms.pixelRatio!.value = pixelRatio;
    // Camera-relative fog preserves the terrain at both close and overview zoom.
    this.fog.near = Math.max(25, distance - 140);
    this.fog.far = distance + 600 - this.profile.fogStrength * 390;
    this.scene.fog = this.fogEnabled ? this.fog : null;
    const needsUpdate = this.changed || advancing || transitioning;
    if (!needsUpdate) return false;
    const frame = sampleTime(this.state.timeOfDay, this.timeFrame);
    const weather = this.profile;
    const night = frame.stars;
    const u = this.sky.material.uniforms;
    (u.zenith!.value as Color)
      .setRGB(...frame.zenith, SRGBColorSpace)
      .lerp(this.overcastZenith, weather.cloudDarkness * (1 - night * 0.8));
    (u.horizon!.value as Color)
      .setRGB(...frame.horizon, SRGBColorSpace)
      .lerp(this.overcastHorizon, weather.cloudDarkness * (1 - night * 0.8));
    (u.sunColor!.value as Color).setRGB(...frame.sun, SRGBColorSpace);
    // Continuous art-directed path; the actual light fades out below the horizon.
    const angle = Math.asin(frame.elevation) * 0.78;
    this.sun.position
      .set(
        Math.cos(frame.azimuth) * Math.cos(angle),
        Math.sin(angle),
        Math.sin(frame.azimuth) * Math.cos(angle),
      )
      .multiplyScalar(300);
    u.sunDirection!.value.copy(this.sun.position).normalize();
    u.sunStrength!.value = (frame.sunlight / 2.5) * weather.sunlightMultiplier;
    this.sun.color.copy(u.sunColor!.value);
    this.sun.intensity = frame.sunlight * weather.sunlightMultiplier;
    this.sun.visible = this.sun.intensity > 0.005;
    this.ambient.color.copy(this.dayAmbient).lerp(this.nightAmbient, night);
    this.ambient.groundColor.copy(this.dayGround).lerp(this.nightGround, night);
    this.ambient.intensity = frame.ambient * weather.ambientMultiplier;
    this.moon.intensity = night * 0.55 * weather.sunlightMultiplier;
    this.fog.color.copy(u.horizon!.value);
    this.sky.starMaterial.uniforms.brightness!.value =
      night * (1 - weather.cloudDarkness) * 0.88;
    this.sky.stars.visible = this.sky.starMaterial.uniforms.brightness!.value > 0.005;
    this.clouds.mesh.visible = this.cloudsEnabled;
    this.clouds.mesh.material.color
      .copy(this.cloudDay)
      .lerp(this.cloudNight, night)
      .lerp(this.cloudStorm, weather.cloudDarkness * (1 - night * 0.4));
    this.cloudAge += dt;
    if (this.changed || transitioning || this.cloudAge >= 0.05) {
      this.clouds.update(this.elapsed, weather.cloudCoverage, weather.cloudDarkness);
      this.cloudAge = 0;
    }
    this.rain.mesh.visible = weather.rainIntensity > 0.005;
    this.rain.mesh.material.uniforms.elapsed!.value = this.elapsed;
    this.rain.mesh.material.uniforms.intensity!.value = weather.rainIntensity;
    this.changed = false;
    return true;
  }
  dispose(): void {
    this.scene.remove(this.root);
    if (this.scene.fog === this.fog) this.scene.fog = null;
    this.sky.dispose();
    this.clouds.dispose();
    this.rain.dispose();
    this.sun.dispose();
    this.moon.dispose();
    this.ambient.dispose();
  }
}
