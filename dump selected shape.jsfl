// This script is for dumping the selected shapes in all keyframes from a selected layer

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

sel_layer_n = fl.getDocumentDOM().getTimeline().getSelectedLayers()[0];
sel_layer = fl.getDocumentDOM().getTimeline().layers[sel_layer_n];

fl.trace("processing layer '"+sel_layer.name+ "'(type:"+sel_layer.layerType + ")");
var frames = sel_layer.frames;

// This object contains all the info needed to be dumped.
var shapes_info = {};
var keyframe = {};
var shape_obj = {};
var stage_info = {};
/* These are the object prototype

shape_obj = {
    'parts': [{
        'edges': {
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

var extract_shape = function(element) {
    if (element.elementType !== "shape") {
        return;
    }

    // Construct the shape object
    var obj_shape = {
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

        // assert that [one key point] has exatly 4 points
        if (cubicPoints.length !== 4) {
            log.error("cubicPoints.length != 4, it has" + cubicPoints.length);
            return;
        }

        var obj_cubic_point = {
            'control_point_1': create_point(cubicPoints[1].x, cubicPoints[1].y),
            'control_point_2': create_point(cubicPoints[2].x, cubicPoints[2].y),
            'point_from': create_point(cubicPoints[0].x, cubicPoints[0].y),
            'point_to': create_point(cubicPoints[3].x, cubicPoints[3].y)
        };
        return obj_cubic_point;
    }

    // Get all the cubic points from all `contour` and their `.edge`
    for(var i_contour = 0; i_contour < element.contours.length; i_contour++) {
        var the_contour = element.contours[i_contour];
        if (the_contour.interior === true) {

            var list_edges = [];
            var he = the_contour.getHalfEdge();
            var iStart = he.id;
            var id = 0;
            while (id !== iStart) {

                // Get the next vertex.
                var vrt = he.getVertex();
                var he_eg = he.getEdge();
                // Construct the edge object
                var o = {
                    'cubic_point': get_cubic_point_from_edge(he_eg, element),
                    'stroke': he_eg.stroke,
                    'isLine': he_eg.isLine,
                    'cubicSegmentIndex': he_eg.cubicSegmentIndex
                };
                list_edges.push(o);

                he = he.getNext();
                id = he.id;
            }

            // Construct the part object
            var part = {
                'edges': list_edges,
                'fill': the_contour.fill,
                'interior': the_contour.interior,
                'orientation': the_contour.orientation
            };
            obj_shape.parts.push(part);

        }

    }

    /*// Get all the cubic points
    var obj_cubic_point_list = [];
    for (var _j = 0; _j < segment_order_list.length; _j++) {

        var csi = segment_order_list[_j];
        var cubicPoints = element.getCubicSegmentPoints(csi);  

        // assert that [one key point] has exatly 4 points
        if (cubicPoints.length != 4) {
            log.error("[W] cubicPoints.length != 4, it has" + cubicPoints.length);
            return;
        }

        obj_cubic_point = {
            'control_point_1': create_point(cubicPoints[1].x, cubicPoints[1].y),
            'control_point_2': create_point(cubicPoints[2].x, cubicPoints[2].y),
            'point_from': create_point(cubicPoints[0].x, cubicPoints[0].y),
            'point_to': create_point(cubicPoints[3].x, cubicPoints[3].y),
            'point_info': edge_info_list[_j]
        };
        obj_cubic_point_list.push(obj_cubic_point);
    }

    // Extract the fill style of the shape
    //      There're 2 contours for each shape, for each contour there are 2 fill object.
    //      Which one should be use? 
    var fill = '';
    var _fill_list = [];
    for (var _c in element.contours) {
        var _f = element.contours[_c].fill;
        _fill_list.push(_f);
        if (_f.style === 'solid') {
            fill = _f;
        }
    }*/


    return obj_shape;

};

var save_txtfile = function(contents) {
    if (!contents)
        return false;
    var fileURL = '';

    fileURL = fl.browseForFileURL("save", "将 JSON 另存为...", "JSON 文件·(*.json)", "json");
        if (!fileURL || !fileURL.length)
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

var get_stage_info = function(doc) {
    var stage_info = {
        'fps': doc.frameRate,
        'stage_height': doc.height,
        'stage_width': doc.width,
        'bg_color': doc.backgroundColor
    };
    return stage_info;
};

// Walk thru all the frames
var kf_list = [];
for(j=0; j<frames.length; j++) {

    if (frames[j].startFrame === j) {
        // This is a keyframe
        log.info("Processing keyframe " + j + ":");

        if (frames[j].elements.length > 1) {
            log.warning("frames[j].elements.length > 1, but only process the first element");    
        }        
        element = frames[j].elements[0];

        if (element.elementType !== "shape") {
            log.warning("element.elementType !== shape, skip this frame...");    
            continue;
        }

        s = extract_shape(element);
        if (!s) {
            log.warning('extract shape fail');
        }

        //fl.trace(JSON.stringify(s));

        // Construct the keyframe obj
        var keyframe = {
            'frame_n': j,
            'frame_label' : frames[j].name,
            'duration': frames[j].duration,
            'tween_type': frames[j].tweenType,
            'ease_curve': frames[j].getCustomEase(),
            'shape': s
        };
        kf_list.push(keyframe);
    }
}

// Construct the overall info
shapes_info = {
    'stage_info': get_stage_info(fl.getDocumentDOM()),
    'layer': 'l'+sel_layer_n+'-'+sel_layer.name,
    'total_frame_count': sel_layer.frameCount,
    'keyframes': kf_list
};

//var save_file_path = fl.getDocumentDOM().path;
json_txt = JSON.stringify(shapes_info);
saved_path = save_txtfile(json_txt);
if (saved_path) {
    log.info('json file saved to ' + saved_path);
}


