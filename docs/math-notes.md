# Description

This file is intended for recording and visualizing core math concepts used in the project.

## Cap Plane Rotation

In Three.js, a `PlaneGeometry` lies in the **XY plane**, with its normal vector pointing in the **+Z direction** by default.  
However, in our case, we want the plane to face **+Y** (like a water surface cap). So, why do we rotate it like this?

``` JavaScript
THREE.Euler(-Math.PI / 2, 0, -Math.PI / 2, 'XYZ')
```

Let’s look at the diagram below:

![Axis Rotation](../public/images/axis-rotation.svg)

The two coordinate systems at the top represent the default orientation of `PlaneGeometry`. Its normal points along +Z.
We want to rotate it so that the normal points up, along +Y.

To understand the rotation, apply the ***Right-Hand Thumb Rule***:

1. First rotation (around X-axis):
    - We're rotating from the +Z direction to the +Y direction.
    - Using the right-hand rule, rotating clockwise (i.e. `-90°`) around X will swing Z → Y.
    - This aligns the plane's face in the correct direction.

2. Second rotation (around Z-axis):
    - After the first rotation, the plane is facing up, but its axes may not be aligned.
    - We rotate again around the Z-axis to align X and Y to match the world axes.
    - Again, we apply `-90°` clockwise using the right-hand rule.

The full transformation gives us a plane that lies flat, faces up (+Y), and matches world axis orientation.

## Reference

- [Gerstner Wave](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models)
