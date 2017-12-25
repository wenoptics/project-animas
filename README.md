## What is it?
**Project Animas** is a solution to create interactive graphics with the powerful Adobe Animate CC (formerly Adobe Flash Professional), aiming at speeding up the process of interactive graphic content design, testing and publish for variety of graphical platform including HTML5 Canvas, WebGL and any other custom client.

## How does it work?
**Project Animas** has an Adobe Animate CC(aka AN) plugin with UI that can be operated inside AN and an animation engine. The plugin for AN enables you to export almost any of the content you've created on AN, including

 - Layer object
 - Timeline object
 - Graphics including Shape object, path*, bitmap, text*, clip*
 - Frame and Tween, including shape tween and motion*
 - Custom easing
 - Library item
 - Embedded ActionScript*

(*) planning

After you have your stunning animations created on AN and exported using the plugin, presented is the data file that descripted the complete animations. With the power of the animation engine, the animations are now available on your custom platform, plus the ability to be fully interactive. To be specific, the animation engine exports several interfaces and provides ample events, which enables operating on runtime with every single element on the stage. The animation engine allows you to seek to any frame, start tween animation between any two states, even manually interpolate through the tween, and etc.

There is (currently only) one animation engine implemented for HTML5 Canvas, using [CreateJS](createjs.com) (EaselJS and TweenJS) and the animation engine interfaces for JavaScript. With the help of it, I created this cute doggy that is constantly looking at you (*try tap him!*).

## How does it different with the `Publish to HTML5` in AN, and how are they related?
Yes there an publish option in AN that can publish your animation project to HTML5 Canvas(and WebGL). But once you publish your graphics content with that option, the animations are just WHAT THEY ARE as you created, losing on-runtime modification ability. i.e. the Shape object that constructed with cubic Bezier paths are rendered in different manner. The Shape published with AN are composed with a fixed point list that describing each single frame. The animation engine however, keep track of the vertices of each keyframe, and the shape in between keyframes are generated on runtime. This sacrifices runtime performance for interactive ability.

The HTML5 animation AN created uses CreateJS, which inspires the animation engine that are implemented for HTML5.

## Catch a glimpse

![01.png](img/01.png "(Support keyframe labeling for conveniently accessing on runtime)")
(Support keyframe labeling for conveniently accessing on runtime)

![02.png](img/02.png "(Support customizing guided layer for special usage)")
(Support customizing guided layer for special usage)

Make a blink-eye animation:
```javascript
let kf_right_eyelid_closed = get_keyframe_by_label(scene_data.layers,
    "state_eyelid_closed", "eyelid_right");

let sst_right = new KEYFRAME_CUSTOM_TWEEN()
    .get(dict_drawing_obj_by_layer_name['eyelid_right'], stage)
    .from_state(kf_right_eyelid_opened, true)
    .to_state(kf_right_eyelid_closed, 150)
    .to_state(kf_right_eyelid_opened, 150);

sst_right._export().start();
```
And much more…!

## TODOs
 - (AN plugin dev) More support in AN (grouped elements, symbol, etc.)
 - (animation engine dev) Generalized animation engine for universal platform support
 - (animation engine dev) HTML5 implementation support more drawing features (stroke, alpha, etc.)
 - UI for generation code snippet




