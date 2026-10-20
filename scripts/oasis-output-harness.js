import {
  ACESFilmicToneMapping,
  HalfFloatType,
  LinearToneMapping,
  SRGBColorSpace,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createSanctuaryOutput } from '../src/jelly-oasis/environment/createSanctuaryOutput';

// Retained pre-optimization shader: a GPU regression fixture, not product code.
const legacyGrade = {
  uniforms: { tDiffuse: { value: null }, night: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float night; varying vec2 vUv;
    void main() {
      vec4 source=texture2D(tDiffuse,vUv);
      float luma=dot(source.rgb,vec3(.2126,.7152,.0722));
      vec3 color=mix(vec3(luma),source.rgb,1.08);
      float shadows=1.-smoothstep(.02,.38,luma);
      color*=mix(vec3(1.),vec3(.94,1.025,1.055),shadows*(.4+night*.6));
      gl_FragColor=vec4(max(color,vec3(0.)),source.a);
    }`,
};

export async function verifyOutput(width = 1440, height = 900) {
  const renderer = new WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.outputColorSpace = SRGBColorSpace;
  const source = new WebGLRenderTarget(width, height, {
    type: HalfFloatType,
    depthBuffer: false,
  });
  const intermediate = source.clone();
  const generator = new ShaderPass({
    uniforms: {},
    vertexShader: legacyGrade.vertexShader,
    fragmentShader: `varying vec2 vUv; void main() {
      gl_FragColor=vec4(vUv.x*vUv.x*4.,vUv.y*vUv.y*2.,fract(vUv.x*8.+vUv.y)*.5,1.);
    }`,
  });
  const grade = new ShaderPass(legacyGrade);
  const oldOutput = new OutputPass();
  const output = createSanctuaryOutput();
  oldOutput.renderToScreen = output.renderToScreen = true;
  const gl = renderer.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const before = () => {
    grade.render(renderer, intermediate, source);
    oldOutput.render(renderer, null, intermediate);
  };
  const after = () => output.render(renderer, null, source);
  const result = {
    width,
    height,
    comparisons: [],
    gpu: { supported: Boolean(ext), pairs: [] },
  };
  try {
    generator.render(renderer, source, null);
    for (const toneMapping of [ACESFilmicToneMapping, LinearToneMapping]) {
      renderer.toneMapping = toneMapping;
      for (const night of [0, 0.5, 1]) {
        renderer.toneMappingExposure = 1.05;
        grade.uniforms.night.value = output.uniforms.night.value = night;
        before();
        const a = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, a);
        after();
        const b = new Uint8Array(a.length);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, b);
        let max = 0,
          total = 0,
          changed = 0;
        for (let i = 0; i < a.length; i++) {
          const delta = Math.abs(a[i] - b[i]);
          max = Math.max(max, delta);
          total += delta;
          changed += Number(delta > 0);
        }
        result.comparisons.push({
          toneMapping,
          night,
          maxChannelDelta: max,
          meanChannelDelta: total / a.length,
          changedChannelFraction: changed / a.length,
        });
      }
    }
    renderer.toneMapping = ACESFilmicToneMapping;
    // Diagnostic only: wait asynchronously for GPU queries, never in the app loop.
    if (ext) {
      const measure = async (render) => {
        const query = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
        for (let i = 0; i < 12; i++) render();
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        gl.flush();
        const deadline = performance.now() + 60000;
        while (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
          if (performance.now() > deadline) throw new Error('GPU query timeout');
          await new Promise((done) => setTimeout(done, 25));
        }
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6 / 12;
        gl.deleteQuery(query);
        if (disjoint) throw new Error('Disjoint GPU query; measurement invalid');
        return ms;
      };
      for (let i = 0; i < 3; i++) {
        const pair = {};
        for (const variant of i % 2 ? ['after', 'before'] : ['before', 'after'])
          pair[variant] = await measure(variant === 'before' ? before : after);
        result.gpu.pairs.push(pair);
      }
    }
    return result;
  } finally {
    generator.dispose();
    grade.dispose();
    oldOutput.dispose();
    output.dispose();
    source.dispose();
    intermediate.dispose();
    renderer.dispose();
  }
}
