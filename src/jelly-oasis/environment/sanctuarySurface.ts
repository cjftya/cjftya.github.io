import type { MeshStandardMaterial } from 'three';

/** Painted surface variation and leaf transmission, still lit by the scene.
 * No emission blanket: facet normals, shadows and wind remain Three's own. */
export function sanctuarySurface(material: MeshStandardMaterial) {
  const before = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    shader.vertexShader = 'varying vec3 sanctuaryPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vec4 sanctuaryWorld = vec4(transformed, 1.);
      #ifdef USE_INSTANCING
        sanctuaryWorld = instanceMatrix * sanctuaryWorld;
      #endif
      sanctuaryPosition = (modelMatrix * sanctuaryWorld).xyz;`,
    );
    shader.fragmentShader = 'varying vec3 sanctuaryPosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float leafMask = 0.;
      #ifdef USE_COLOR
        leafMask = smoothstep(.015, .11, vColor.g - vColor.r);
      #endif
      float paintedPatch = .5 + .5 * sin(sanctuaryPosition.x * .19
        + sin(sanctuaryPosition.z * .21) * 1.7 + sanctuaryPosition.y * .12);
      vec3 coolLeaf = vec3(.72, 1.07, 1.24);
      vec3 warmLeaf = vec3(1.10, 1.09, .78);
      diffuseColor.rgb *= mix(vec3(1.), mix(coolLeaf, warmLeaf, paintedPatch), leafMask * .68);`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `// Modest backlit colour follows actual incident illumination.
      vec3 rimDirection = normalize((viewMatrix * vec4(-.6, .65, -.45, 0.)).xyz);
      float rim = pow(1. - max(0., dot(normal, normalize(vViewPosition))), 2.5)
        * smoothstep(-.2, .8, dot(normal, rimDirection));
      vec3 incident = reflectedLight.indirectDiffuse + reflectedLight.directDiffuse;
      outgoingLight += incident * vec3(.42, .90, .83) * rim * (.18 + leafMask * .55);
      #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => `${key}:sanctuary-surface-v1`;
  material.needsUpdate = true;
}
