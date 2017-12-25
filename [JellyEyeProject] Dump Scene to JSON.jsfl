// This script is for dumping the scene layers to a JSON file

//---------------------------JSON Helper----------------------------------------------
(function(global){
    
    /**
    *  The JSON serialization and unserialization methods
    *  @class JSON
    */
    var JSON = {};

    JSON.prettyPrint = false;

    /**
    *  implement JSON.stringify serialization
    *  @method stringify
    *  @param {Object} obj The object to convert
    */
    JSON.stringify = function(obj)
    {
        return _internalStringify(obj, 0);
    };

    function _internalStringify(obj, depth, fromArray)
    {
        var t = typeof (obj);
        if (t != "object" || obj === null)
        {
            // simple data type
            if (t == "string") return '"'+obj+'"';
            return String(obj);
        }
        else
        {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);

            var joinString, bracketString, firstPropString;
            if(JSON.prettyPrint)
            {
                joinString = ",\n";
                bracketString = "\n";
                for(var i = 0; i < depth; ++i)
                {
                    joinString += "\t";
                    bracketString += "\t";
                }
                joinString += "\t";//one extra for the properties of this object
                firstPropString = bracketString + "\t";
            }
            else
            {
                joinString = ",";
                firstPropString = bracketString = "";
            }
            for (n in obj)
            {
                v = obj[n]; t = typeof(v);

                // Ignore functions
                if (t == "function") continue;

                if (t == "string") v = '"'+v+'"';
                else if (t == "object" && v !== null) v = _internalStringify(v, depth + 1, arr);

                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
            return (fromArray || depth === 0 ? "" : bracketString)+ (arr ? "[" : "{") + firstPropString + json.join(joinString) + bracketString + (arr ? "]" : "}");
        }
    }

    /**
    *  Implement JSON.parse de-serialization
    *  @method parse
    *  @param {String} str The string to de-serialize
    */
    JSON.parse = function(str)
    {
        if (str === "") str = '""';
        eval("var p=" + str + ";"); // jshint ignore:line
        return p;
    };

    // Assign to global space
    global.JSON = JSON;

}(window));

//-------------------------Main-------------------------------------------------------

// This object contains all the info needed to be dumped.
var shapes_info = {};
var keyframe = {};
var shape_obj = {};
var stage_info = {};
/* These are the object prototype

shape_obj = {
    'parts': [{
        'edge_segments': {
            'cubic_points': [],
            'stroke': {},
            'isLine': ,
            'cubicSegmentIndex': ,
        },
        'fill': {},
        'interior': ,
        'orientation': ,
    }]

};
keyframe = {
    'frame_n': 0,
    'frame_label' : 'name',
    'duration': ,
    'tween_type': ,
    'shape': {}
};
shapes_info = {
    'stage_info': {},
    'layer': '',
    'total_frame_count': ,
    'keyframes': []
};
stage_info = {
    'fps': 24,
    'stage_height': 200,
    'stage_width': 200,
    'bg_color': '#000000'
}
*/

var log = {
    'tag': '',
    'info': function(s) { fl.trace("[Info]["+this.tag+"]" + s); },
    'warning': function(s) { fl.trace("[Warning]["+this.tag+"]" + s); },
    'error': function(s) { fl.trace("[Error]["+this.tag+"]" + s); }
};

var create_point = function(x, y) { return {'x': x, 'y': y}; };
var create_point_offset = function(x, y, tx, ty) { return {'x': x-tx, 'y': y-ty}; };
var is_element_in_list = function(element, list) {
    for (var _i=0; _i<list.length; _i++) {
        if (list[_i] === element) return true;
    }
    return false;
};
var ui_save_file = function() {
    return fl.browseForFileURL("save", "将 JSON 另存为...", "JSON 文件·(*.json)", "json");
};
var check_url = function (url) {
    return (url && url.length)
};
var save_txt_file = function(contents, url_save_to) {
    if (!contents)
        return false;
    var fileURL = '';

    fileURL = url_save_to;
    if (!check_url(fileURL))
        return false;

    var ending = fileURL.slice(-5);
    if (ending !== '.json')
        fileURL += '.json';

    //var contentsLinebreaks = stringReplace(contents, "\n", "\r\n");

    if (!FLfile.write(fileURL, contents))
    {
        alert('保存失败');
        return false;
    }
    return fileURL;
};
var PATH_SEP = '/'; // Can't use `const`, will encounter problem in Animate CC
var path_get_parent = function(file_path){
    var _l = file_path.split(PATH_SEP);
    return _l.slice(0, _l.length-1).join(PATH_SEP)
};
var path_concat = function (path1, path2) {
    if (path1[path1.length-1] !== PATH_SEP) {
        path1+=PATH_SEP;
    }
    return path1+path2;
};

var init_library_items = function () {
    var ret_dict = {};
    var item_list = fl.getDocumentDOM().library.items;
    for (var i in item_list) {
        ret_dict[item_list[i].name] = item_list[i];
        ret_dict[item_list[i].name].has_dumped = false;
    }
    return ret_dict;
};
var lib_items = init_library_items();

var extract_shape = function(element) {
    if (element.elementType !== "shape") {
        return;
    }

    // Construct the shape object
    var obj_shape = {
        'isOvalObject': element.isOvalObject,
        'isRectangleObject': element.isRectangleObject,
        'parts': []
    };

    // Walk thru shape's egdes, we will use this to find out the order of CubicSegments
    var segment_order_list = [];
    var edges = element.edges;
    if (edges.length < element.numCubicSegments) {
        log.error("edges.length should be >= element.numCubicSegments");
        return;
    }
    for (var _e = 0; _e < edges.length; _e++) {
        var eg = edges[_e];
        var csi = eg.cubicSegmentIndex;

        var _update = function(eg) {
            segment_order_list.push(eg.cubicSegmentIndex);
        };

        if (segment_order_list.length === 0) {
            _update(eg);
        } else if(segment_order_list[segment_order_list.length-1] !== csi) {
            _update(eg);  
        }
    }
    if(segment_order_list.length !== element.numCubicSegments) {
        log.error("segment_order_list.length != element.numCubicSegments\n\t" 
            + segment_order_list.length + "!=" + element.numCubicSegments);
        return;
    }

    function get_cubic_point_from_edge(edge, element) {
        var cubicPoints = element.getCubicSegmentPoints(edge.cubicSegmentIndex);

        // assert that [one key point] has exactly 4 points
        if (cubicPoints.length !== 4) {
            log.error("cubicPoints.length != 4, it has" + cubicPoints.length);
            return;
        }

        /*var is_in_bounds = function (x, y) {
            return (x>=element.left && x <= element.left+element.width
                && y>=element.top && y <= element.top+element.height);
        };
        if (is_in_bounds(cubicPoints[3].x, cubicPoints[3].y) &&
            is_in_bounds(cubicPoints[0].x, cubicPoints[0].y)
        ) { log.info("all the points are in bounds") } else { log.info("not all the points are in bounds") }*/

        function transformPointXY( x, y, mat ) {
            var _x = x*mat.a + y*mat.c + mat.tx;
            var _y = x*mat.b + y*mat.d + mat.ty;
            return create_point(_x, _y);
        }

        var obj_cubic_point = {
            // These points are transform by the transform matrix (should I just reserve the origin data as well as the matrix data?)
            'control_point_1': transformPointXY(cubicPoints[1].x, cubicPoints[1].y, element.matrix),
            'control_point_2': transformPointXY(cubicPoints[2].x, cubicPoints[2].y, element.matrix),
            'point_from': transformPointXY(cubicPoints[0].x, cubicPoints[0].y, element.matrix),
            'point_to': transformPointXY(cubicPoints[3].x, cubicPoints[3].y, element.matrix)
        };
        return obj_cubic_point;
    }

    // (`parts`) Get all the cubic points from all `contour` and their `.edge`
    for(var i_contour = 0; i_contour < element.contours.length; i_contour++) {
        var the_contour = element.contours[i_contour];
        if (the_contour.interior === true) {

            var _unique_csi_list = [];
            var list_edges = [];
            var he = the_contour.getHalfEdge();
            var iStart = he.id;
            var id = 0;
            while (id !== iStart) {

                var he_eg = he.getEdge();
                if (!is_element_in_list(he_eg.cubicSegmentIndex, _unique_csi_list))
                {
                    _unique_csi_list.push(he_eg.cubicSegmentIndex);

                    // Construct the edge object
                    var o = {
                        'cubicSegmentIndex': he_eg.cubicSegmentIndex,
                        'cubic_point': get_cubic_point_from_edge(he_eg, element),
                        'stroke': he_eg.stroke,
                        'isLine': he_eg.isLine
                    };
                    list_edges.push(o);
                }

                he = he.getNext();
                id = he.id;
            }

            // Construct the part object
            var part = {
                'edge_segments': list_edges,
                'fill': the_contour.fill,
                'interior': the_contour.interior,
                'orientation': the_contour.orientation
            };
            obj_shape.parts.push(part);

        }

    }

    var is_csi_in_part = function(csi, part) {
        for (var i_seg in part.edge_segments) {
            if(csi === part.edge_segments[i_seg].cubicSegmentIndex) {
                return true;
            }
        }
        return false;
    };
    // Sort the points according to `segment_order_list`
    for(var idx=0; idx<segment_order_list.length; ) {
        var csi = segment_order_list[idx];
        var csi_found = false;
        //log.info("checking csi of "+ csi);
        for (var i_part in obj_shape.parts) {
            //log.info("\tchecking part["+ i_part+"]");
            var current_part = obj_shape.parts[i_part];
            if (is_csi_in_part(csi, current_part)) {
                csi_found = true;
                var n_seg = current_part.edge_segments.length;
                var ol = segment_order_list.slice(idx, idx+n_seg);
                current_part.order_list = ol;
                //log.info('segment_order_list[idx:idx+n_seg] === '+ol.toString());
                //log.info('(segment_order_list[:] === '+segment_order_list.toString()+')');

                // Just check whether all the `csi`s are in the segment
                for (var _csi in ol) {
                    if (is_csi_in_part(ol[_csi], current_part) === false) {
                        log.error("asserting fail: not all csi are in list (csi=="+ol[_csi]+" not in this part)");
                        return
                    }
                }

                // Do the actual sorting
                current_part.cubic_segment_ordered = [];
                for (var _csi in ol) {
                    for (var i_seg in current_part.edge_segments) {

                        // log.info(_csi + " vs " + current_part.edge_segments[i_seg].cubicSegmentIndex);
                        // log.info(typeof _csi + " vs " + typeof current_part.edge_segments[i_seg].cubicSegmentIndex);

                        if(ol[_csi] === current_part.edge_segments[i_seg].cubicSegmentIndex) {
                            //log.info('got you');
                            var n = current_part.cubic_segment_ordered.length;
                            if (n === 0 || current_part.cubic_segment_ordered[n-1].cubicSegmentIndex !== ol[_csi]) {
                                // Filter out the duplicated segment
                                current_part.cubic_segment_ordered.push(
                                    current_part.edge_segments[i_seg]
                                );
                            }

                        }
                    }
                }
                //log.info(current_part.cubic_segment_ordered.toString());

                idx += n_seg;
                break;
            }
        }
        if (csi_found===false) {
            // This csi cannot be found in any of the parts (maybe somewhere in the interior==false parts)
            // So we skip this csi
            log.info("skipping csi "+ csi+"(csi-order list=="+segment_order_list.toString());
            idx++;
        }

    }

    var sum = 0;
    for (var i_p in obj_shape.parts) {
        sum += obj_shape.parts[i_p].cubic_segment_ordered.length;
    }
    if (sum !== element.numCubicSegments) {
        log.warning("sum of cubic_segment_ordered.length should be === element.numCubicSegments\nbut "
            + sum + " !== " + element.numCubicSegments);
        //return;
    }

    return obj_shape;

};
var extract_layer = function (layer) {
    log.info("extracting layer" + layer.name);
    var frames = layer.frames;

    // Walk thru all the frames
    var kf_list = [];
    for(j=0; j<frames.length; j++) {

        if (frames[j].startFrame === j) {
            // This is a keyframe
            log.info("\tProcessing keyframe " + j + "");

            if (frames[j].elements.length > 1) {
                // TODO
                log.warning("frames[j].elements.length > 1, but only process the first element");
            }
            var element = frames[j].elements[0];

            function add_element_common_to_obj(obj, element) {
                obj['x'] = element.x;
                obj['y'] = element.y;
                obj['transformX'] = element.transformX;
                obj['transformY'] = element.transformY;
                obj['scaleX'] = element.scaleX;
                obj['scaleY'] = element.scaleY;
                obj['width'] = element.width;
                obj['height'] = element.height;
                obj['left'] = element.left;
                obj['top'] = element.top;
                obj['rotation'] = element.rotation;
                obj['skewX'] = element.skewX;
                obj['skewY'] = element.skewY;
            }
            // Construct the keyframe obj
            var keyframe = {
                'frame_n': j,
                'frame_label' : frames[j].name,
                'duration': frames[j].duration,
                'tween_type': frames[j].tweenType,
                'ease_curve': frames[j].getCustomEase()
            };

            if (element.elementType === "shape") {
                log.info("found shape element");
                var s = extract_shape(element);
                if (!s) {
                    log.warning('extract shape fail');
                }else{
                    //fl.trace(JSON.stringify(s));
                    keyframe['shape'] = s;
                    add_element_common_to_obj(s, element);
                    keyframe.type = 'shape';
                    kf_list.push(keyframe);
                }
            } else if (element.elementType === "instance") {
                if (element.instanceType === 'bitmap') {
                    log.info("found instance->bitmap element");
                    var it = element.libraryItem;
                    var relate_path = it.name.replace(PATH_SEP, '__');
                    var save_path = path_concat(path_get_parent(url_save_file), relate_path);
                    //log.info("lib_items[it.name].has_dumped: " + lib_items[it.name].has_dumped);
                    if (!lib_items[it.name].has_dumped) {
                        it.exportToFile(save_path);
                        lib_items[it.name].has_dumped = true;
                        log.info('"'+it.name+'" exported to ' + save_path)
                    }
                    // The bitmap object
                    var b = {
                        'file': relate_path
                    };
                    add_element_common_to_obj(b, element);
                    keyframe['bitmap'] = b;
                    keyframe.type = 'bitmap';
                    kf_list.push(keyframe);
                }
            }

        }
    }

    // Construct layer info
    var layer_info = {
        'stage_info': get_stage_info(fl.getDocumentDOM()),
        'layer_name': layer.name,
        'layer_type': layer.layerType,
        'total_frame_count': layer.frameCount,
        'keyframes': kf_list
    };

    return layer_info;

};

var get_stage_info = function(doc) {
    var stage_info = {
        'fps': doc.frameRate,
        'stage_height': doc.height,
        'stage_width': doc.width,
        'bg_color': doc.backgroundColor
    };
    return stage_info;
};

//------------------------------- Start extracting ------------------------------------
url_save_file = ui_save_file();
if (!check_url) {
    alert("canceled.")
}else{

    // Construct the scene object
    var obj_scene = {
        'scene_info': get_stage_info(fl.getDocumentDOM()),
        'layers': []
    };

    // Walk thru all the layers and extract them
    var l = fl.getDocumentDOM().getTimeline().layers;
    for (var i in l) {
        if (l[i].layerType !== 'normal' && l[i].layerType !== 'guide')
            continue;
        var one_layer_info = extract_layer(l[i]);
        obj_scene.layers.push(one_layer_info);
    }

    //var save_file_path = fl.getDocumentDOM().path;
    json_txt = JSON.stringify(obj_scene);
    saved_path = save_txt_file(json_txt, url_save_file);
    if (saved_path) {
        log.info('json file saved to ' + saved_path);
    }

}



