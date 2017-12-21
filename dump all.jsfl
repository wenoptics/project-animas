// store directory to a variable
var configDir = fl.configDirectory;
// display directory in the Output panel
fl.trace("path of fl.configDirectory == " + fl.configDirectory);

// List all the layers in the timeline of the active document
var tl = fl.getDocumentDOM().getTimeline();
var layers = tl.layers;
fl.trace("counts of layer:" + layers.length);

for(i=0; i<layers.length; i++) {
    fl.trace("\t("+layers[i].layerType + ")"+layers[i].name);
        var frames = layers[i].frames;
        fl.trace("\t\tframe counts:"+frames.length);
        var keys = [];
        for(j=0; j<frames.length; j++) {

            var easeCurve = frames[j].getCustomEase();

            if (frames[j].startFrame == j) {
                // This is a keyframe
                keys.push(j);
                fl.trace("\t\tKeyframe at "+j + " - " + frames[j].name);

                // Print out the ease curve control points
                if(easeCurve.length > 0) {
                    fl.trace("\t\t\t\t easeCurve:");
                    for (g=0; g<easeCurve.length; g++) {
                        fl.trace("\t\t\t\t\t (x, y) == " + easeCurve[g].x + ", " + easeCurve[g].y);       
                    }               
                }
                var _p = ['tweenType', 'tweenEasing', 'tweenInstanceName', 'useSingleEaseCurve', 'isMotionObject()']
                for (var __p in _p) {
                    fl.trace("\t\t\t\t ." + _p[__p] + ': ' + eval('frames[j].'+_p[__p]));    
                }
                

                // Show elements on stage
                es = frames[j].elements;

                fl.trace("\t\t\t\t elements print")
                for (var _e = 0; _e < es.length; _e++) {
                    fl.trace(" \t\t\t\t\t element [" + _e+1 + "/" + es.length + "]");

                    var e = es[_e];
                    pl = [
                        'depth',
                        'elementType',
                        'height',
                        'layer',
                        'left',
                        'locked',
                        'matrix',
                        'name',
                        'rotation',
                        'scaleX',
                        'scaleY',
                        'selected',
                        'skewX',
                        'skewY',
                        'top',
                        'transformX',
                        'transformY',
                        'width',
                        'x',
                        'y'
                    ];

                    for (var _i = 0; _i < pl.length; _i++) {
                        pl[_i]
                        fl.trace("\t\t\t\t\t\t." + pl[_i] + ": " + eval("e."+pl[_i]));
                    }
                    fl.trace("\t\t\t\t\t\t.matrix " + e.matrix+":");
                    fl.trace("\t\t\t\t\t\t\t.a:" + e.matrix.a);
                    fl.trace("\t\t\t\t\t\t\t.b:" + e.matrix.b);
                    fl.trace("\t\t\t\t\t\t\t.c:" + e.matrix.c);
                    fl.trace("\t\t\t\t\t\t\t.d:" + e.matrix.d);
                    fl.trace("\t\t\t\t\t\t\t.tx:" + e.matrix.tx);
                    fl.trace("\t\t\t\t\t\t\t.ty:" + e.matrix.ty);
                    fl.trace("\t\t\t\t\t\t.getTransformationPoint(): (" + e.getTransformationPoint().x+", "+e.getTransformationPoint().y+")");

                    // If it's a shape object
                    if (e.elementType === 'shape') {

                        /*// Cast to shape
                        var sp = (shape)e;*/
                        var sp = e;

                        //sp.beginEdit();

                        pl = [
                            'contours',
                            'edges',
                            'isDrawingObject',
                            'isFloating',
                            'isGroup',
                            'isOvalObject',
                            'isRectangleObject',
                            'members',
                            'numCubicSegments',
                            'vertices'
                        ]
                        fl.trace("\t\t\t\t shape print");
                        for (var _i = 0; _i < pl.length; _i++) {
                            //pl[_i]
                            fl.trace("\t\t\t\t\t\t." + pl[_i] + ": " + eval("sp."+pl[_i]));
                        }


                        // Print the vertices (vertices are points on the path, not control point)       
                        vertices = sp.vertices;                 
                        fl.trace("\t\t\t\t\t vertices print (n" + vertices.length + ")");
                        for (var _v = 0; _v < vertices.length; _v++) {
                            var v = vertices[_v];
                            fl.trace("\t\t\t\t\t\t (x, y): " + v.x + ", " + v.y);
                        }

                        // Print the contours and it's fill       
                        contours = sp.contours;                 
                        fl.trace("\t\t\t\t\t contours print (n" + contours.length + ")");
                        for (var _v = 0; _v < contours.length; _v++) {
                            var v = contours[_v];
                            fl.trace("\t\t\t\t\t\t .interior: " + v.interior);
                            fl.trace("\t\t\t\t\t\t .orientation: " + v.orientation );

                            var f = v.fill;
                            fl.trace("\t\t\t\t\t\t .fill:");

                            fl.trace("\t\t\t\t\t\t\t " 
                                + " color: " + f.color 
                                + " style: " + f.style 
                            );

                            
                            he = v.getHalfEdge();
                            fl.trace("\t\t\t\t\t\t .halfEdge:");
                            var iStart = he.id;
                            var id = 0;
                            while (id != iStart)
                            {
                                // Get the next vertex.
                                var vrt = he.getVertex();
                                var x = vrt.x;
                                var y = vrt.y;
                                fl.trace("\t\t\t\t\t\t\t vrt: " + x + ", " + y);

                                var eg = he.getEdge();
                                fl.trace("\t\t\t\t\t\t\t edge.controlPoints: "
                                    + "(" + eg.getControl(0).x + "," + eg.getControl(0).y + "); "
                                    + "(" + eg.getControl(1).x + "," + eg.getControl(1).y + "); "
                                    + "(" + eg.getControl(2).x + "," + eg.getControl(2).y + "); "
                                );    
                                fl.trace("\t\t\t\t\t\t\t edge.cubicSegmentIndex: " + eg.cubicSegmentIndex);

                                he = he.getNext();
                                id = he.id;
                            }

                        }

                        // Print shape's egdes
                        var edges = sp.edges;
                        fl.trace("\t\t\t\t\t shape's egdes print (n" + edges.length + ")");
                        for (var _e = 0; _e < edges.length; _e++) {
                            var eg = edges[_e];
                            fl.trace("\t\t\t\t\t\t controlPoints: "
                                + "(" + eg.getControl(0).x + "," + eg.getControl(0).y + "); "
                                + "(" + eg.getControl(1).x + "," + eg.getControl(1).y + "); "
                                + "(" + eg.getControl(2).x + "," + eg.getControl(2).y + "); "
                            );    

                            pl = ['id','isLine','stroke','cubicSegmentIndex'];
                            fl.trace("\t\t\t\t\t\t dump edge properties");
                            for (var k in pl) {
                                fl.trace("\t\t\t\t\t\t\t ." +  pl[k] + ": " + eval('eg.'+pl[k]));
                            }

                            var index = eg.cubicSegmentIndex;
                            fl.trace("\t\t\t\t\t\t\t dump elem.getCubicSegmentPoints(" + index + ")");
                            var cubicPoints = sp.getCubicSegmentPoints(index);
                            for (_i=0; _i<cubicPoints.length; _i++) {
                                fl.trace("\t\t\t\t\t\t\t\tindex " + _i 
                                    +" x: " + cubicPoints[_i].x + " y: " + cubicPoints[_i].y);
                            }

                        }


                        //sp.endEdit();

                    }                    

                }

            }

            /* // Test non-keyframes

            hasMP = function(f) {
                if(f.isMotionObject()){
                    if (f.hasMotionPath()){
                        return true;
                    }}
                return false;
            }

            // What's inside the .getCustomEase() object? 
            //      DOC: "an array of JavaScript objects, each of which has an x and y property."

            fl.trace("\t\t\t frame "+ j             
                + " hasMotionPath:"+hasMP(frames[j])
                + " tweenInstanceName:"+frames[j].tweenInstanceName 
                + " hasCustomEase:"+frames[j].hasCustomEase                 
                + " getCustomEase(len): [obj] x"+easeCurve.length
            );  
            */                      

        }
}