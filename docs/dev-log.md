## Dev Log

1. **Project Initialization**  
   Created a minimal Three.js scene using a `BoxGeometry` to represent the water container.  
   Applied a basic custom `ShaderMaterial` to prepare for vertex and fragment shader development.

   ***Purpose:*** Establish a testbed for exploring water surface control and wave effects with GLSL.  

2. **Implemented Basic Wave Function**  
   Created a sine-based wave using the dot product of the XZ world position and a wave direction vector to simulate a directional wave pattern.  
   Initially used a threshold to determine whether a vertex belonged to the top surface or the side walls in order to apply different logic for leveling.

   ***Reason:*** Simple to implement and visually effective for simulating wave motion.  
   ❌ *Problem:* The threshold-based approach only works on simple geometries (e.g., boxes, cylinders). It becomes unreliable on non-flat or complex shapes where the top surface isn't easily distinguishable by Y-position alone.

   **Reference:** [fire-face.com/water](https://fire-face.com/water/)

3. **Added Shader Uniforms**  
   Introduced `waveAmplitude`, `waveFrequency`, `waveSpeed`, and `waterLevel` to control wave behavior and water height from the JavaScript side.

   ***Reason:*** Needed flexible control over surface motion and level for real-time interaction in Three.js.

4. **Built Level Control Logic**  
   Adjusted vertex Y-position directly in the shader using the `waterLevel` uniform.  
   Previous approaches used `clipPlane` or geometry scaling, but those were either visual hacks or unsuitable for dynamic, non-planar geometry.

   ✅ *Why this approach:* Offers finer control and works consistently across arbitrary geometry.

5. **Abandoned Threshold-Based Layer Separation**  
   Decided to drop the threshold method previously used to separate top surface from side walls.  

   ❌ *Problem:* While it worked on simple geometries (like boxes and cylinders), it became unreliable and ambiguous on more complex or curved shapes.  
   ✅ *Decision:* Shift toward a more general approach that avoids explicit surface classification.

6. **Wave Damping Near Boundaries**  
   Added logic to reduce wave amplitude as it gets closer to the ceiling or bottom of the tank. Introduced `tankMinY` and `tankMaxY` to define the vertical bounds.

   ❌ *Problem:* Without damping, waves would unnaturally poke through the top or bottom surfaces.  
   ✅ *Why damping:* Mimics how real water loses energy near physical boundaries, improving visual realism.

7. **Implemented Clipping Logic**  
   Applied Y-based vertex filtering to visually trim the mesh according to `waterLevel`, simulating a flat water surface.  

   ❌ *Problem:* This approach removed the entire top surface geometry, leaving the tank visually hollow when viewed from above.

8. **Restored Surface with Flat Plane**  
   After clipping removed the top surface, added a separate flat `PlaneGeometry` positioned at the water level to restore the water’s visual appearance.

   ❌ *Problem:* While it looked correct from above, it didn't follow the shape of the original mesh and broke immersion when viewed from an angle or with complex geometry.

9. **Tried Using a Squeezed Version of the Original Mesh**  
   Duplicated the original geometry and scaled it down vertically to create a thin “sheet” for the water surface. This visually followed the original shape better than a flat plane.

   ❌ *Problem:* On geometries with non-uniform cross-sections (e.g., a cone), the squeezed version rendered the **outermost silhouette** of the entire mesh, not the actual water-level cross-section. This led to visual artifacts and a broken surface when intersecting shapes varied significantly in width at different heights.

10. **Observed Depth Test Issues During Surface Rendering**  
    During testing with both the flat plane and squeezed geometry approaches, depth testing issues emerged. The clipped mesh beneath the surface still contributed to the depth buffer.

    ❌ *Problem:* This caused z-fighting and visual overlap between the clipped body and the added surface, especially when rotating the camera or viewing the scene from shallow angles.

11. **Explored 2D Stencil Buffer for Water Clipping**  
    Attempted to use the 2D stencil buffer to clip the water surface and create a clean horizontal cutoff at the water level.

    ❌ *Problem:* The stencil buffer operates in screen-space and cannot distinguish between internal regions of a 3D object. As a result, it discards or keeps **entire fragments**, without regard to wave shape, geometry curvature, or per-vertex conditions.

    ✅ *Conclusion:* Abandoned 2D stencil approach and shifted to using 3D geometry as a more spatially aware stencil source.

    **Reference:** [Stencil Buffer Example – StackOverflow](https://stackoverflow.com/questions/59539788/stencil-buffer-in-webgl/59547059#59547059)

12. **Implemented 3D Geometry-Based Stencil Clipping**  
    Used a duplicate of the original water geometry as a stencil mask, rendered into the stencil buffer with customized settings. This allowed dynamic per-fragment masking based on the water's actual shape and level.

    ✅ *Result:* Successfully clipped the water using the correct shape at the correct level, even with waves applied.  
    ✅ *Goal Reached:* This solution respects both water height and wave deformation, and works with arbitrary geometry in real-time.

## Future Works

The current implementation uses the default WebGL1 renderer in Three.js. While it's sufficient for most cases and ensures broad compatibility, exploring WebGL2 offers more advanced features and flexibility.

One of the main goals for future improvement is to implement 3D texture masking using `Data3DTexture` in WebGL2. This would allow fragment-level control of water visibility inside arbitrary geometry, eliminating the need for stencil masks and cap geometry. It also opens the door to simulating more complex effects such as internal flow, foam, and volumetric shading.

## References

### Used In This Project

1. [fire-face.com/water](https://fire-face.com/water/) – A WebGL-based water simulation demo that inspired the visual direction of this project. Useful for understanding wave behavior and shader-driven surface animation.

2. [Stencil Buffer Example – StackOverflow](https://stackoverflow.com/questions/59539788/stencil-buffer-in-webgl/59547059#59547059) – Research into visibility masking using the stencil buffer in WebGL.

### Explored or Inspirational

3. [THREE-CSGMesh](https://github.com/manthrax/THREE-CSGMesh) – A library for performing CSG operations in Three.js. Explored during research but not directly used in this project.

4. [WebGL Water by Evan Wallace](https://github.com/evanw/webgl-water) - A classic real-time water simulation using reflection, refraction, normal mapping, and caustics in WebGL.
