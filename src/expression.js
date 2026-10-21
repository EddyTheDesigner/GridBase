/* Shared layout math. The expression compiler removes unused sections per property. */
function gridBaseEvaluate(c, index, count, groups, kind, base) {
    var cache={};
    function s(n) { if(cache[n]===undefined)cache[n]=Number(c.effect('GB '+n)(1).value);return cache[n]; }
    function clamp(x,a,b) { return Math.max(a,Math.min(b,x)); }
    function mix(a,b,t) { return a+(b-a)*t; }
    function vec(a,b,t) { return [mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2]||0,b[2]||0,t)]; }
    function sub(a,b) { return [a[0]-b[0],a[1]-b[1],(a[2]||0)-(b[2]||0)]; }
    function norm(a) { var d=Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);return d>0.00001?[a[0]/d,a[1]/d,a[2]/d]:[0,0,1]; }
    function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
    function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
    function rot(p,a) { var co=Math.cos(a),si=Math.sin(a);return [p[0]*co-p[1]*si,p[0]*si+p[1]*co,p[2]]; }
    function segment(prop) {
        var v=Number(prop.value), n=prop.numKeys;
        if(n<2 || time<=prop.key(1).time || time>=prop.key(n).time) return [v,v,0];
        var k=prop.nearestKey(time).index;if(prop.key(k).time>time)k--;
        var a=Number(prop.key(k).value),b=Number(prop.key(k+1).value);
        return [a,b,a===b?0:clamp((v-a)/(b-a),0,1)];
    }
    var rad=Math.PI/180, n=Math.max(1,count), i=index, t=n>1?i/(n-1):0;
    var seed=0;
    function rand(k) { var x=Math.sin((k+1)*127.1+(seed+1)*311.7)*43758.5453;return x-Math.floor(x); }
    // @slot
    if(s('Shuffle')>0.5) {
        seed=s('Seed');
        var order=[],j,tmp;for(j=0;j<n;j++)order.push(j);
        for(j=n-1;j>0;j--){var q=Math.floor(rand(j)* (j+1));tmp=order[j];order[j]=order[q];order[q]=tmp;}i=order[index];t=n>1?i/(n-1):0;
    }
    // @end
    // @layout
    function sphere(idx) { var y=1-2*(idx+0.5)/n,r=Math.sqrt(Math.max(0,1-y*y)),a=idx*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*r,y,Math.sin(a)*r]; }
    function focus(p) {
        var f=segment(c.effect('GB Focus Target')(1));if(f[0]<=0 && f[1]<=0)return p;
        var a=sphere(clamp(Math.round(f[0])-1,0,n-1)),b=sphere(clamp(Math.round(f[1])-1,0,n-1));
        var angle=Math.acos(clamp(dot(a,b),-1,1)),v;
        if(angle<0.00001)v=a;
        else if(Math.PI-angle<0.0001){var side=norm(cross(a,Math.abs(a[0])<0.9?[1,0,0]:[0,1,0]));v=vec(a,side,0);for(var z=0;z<3;z++)v[z]=a[z]*Math.cos(Math.PI*f[2])+side[z]*Math.sin(Math.PI*f[2]);}
        else {v=[];for(var z=0;z<3;z++)v[z]=(a[z]*Math.sin((1-f[2])*angle)+b[z]*Math.sin(f[2]*angle))/Math.sin(angle);}
        v=norm(v);var dest=[0,0,-1],axis=cross(v,dest),cos=clamp(dot(v,dest),-1,1),sin=Math.sqrt(dot(axis,axis));
        if(sin<0.00001)return cos>0?p:[-p[0],p[1],-p[2]];
        axis=norm(axis);var cr=cross(axis,p),dp=dot(axis,p),out=[];for(var z=0;z<3;z++)out[z]=p[z]*cos+cr[z]*sin+axis[z]*dp*(1-cos);return out;
    }
    function pathPoint(u) {
        var shape=Math.round(s('Path Shape')),w=s('Path Width')/2,h=s('Path Height')/2;
        var closed=true;if(shape===5){try{closed=c.effect('GB Path Source')(1).mask(1).maskPath.isClosed();}catch(e){closed=false;}}
        var start=s('Trim Start')/100,end=s('Trim End')/100;
        var pct=mix(start,end,u)+s('Path Progress')/100;
        if(closed || pct<0 || pct>1)pct=((pct%1)+1)%1;else pct=clamp(pct,0,1);
        if(shape===5){try{var pp=c.effect('GB Path Source')(1).mask(1).maskPath.pointOnPath(pct);return c.fromWorld(c.effect('GB Path Source')(1).toWorld([pp[0],pp[1],0]));}catch(e){return [mix(-w,w,pct),0,0];}}
        if(shape===1)return [Math.cos(pct*Math.PI*2)*w,Math.sin(pct*Math.PI*2)*h,0];
        var vertices=[],k,num=Math.max(3,Math.round(s('Polygon Points')));
        if(shape===2)vertices=[[-w,-h],[w,-h],[w,h],[-w,h]];
        else {if(shape===4)num*=2;for(k=0;k<num;k++){var a=k*Math.PI*2/num-Math.PI/2,rr=shape===4&&k%2?0.45:1;vertices.push([Math.cos(a)*w*rr,Math.sin(a)*h*rr]);}}
        var lengths=[],total=0;for(k=0;k<vertices.length;k++){var d=sub(vertices[(k+1)%vertices.length],vertices[k]),len=Math.sqrt(dot(d,d));lengths.push(len);total+=len;}
        var distance=pct*total;for(k=0;k<vertices.length;k++){if(distance<=lengths[k] || k===vertices.length-1)return vec(vertices[k],vertices[(k+1)%vertices.length],lengths[k]?distance/lengths[k]:0);distance-=lengths[k];}
        return [0,0,0];
    }
    function layout(mode,idx) {
        mode=Math.round(clamp(mode,1,4));var p,cols,rows;
        if(mode===1){cols=Math.max(1,Math.round(s('Columns')));rows=Math.ceil(n/cols);p=[(idx%cols-(Math.min(n,cols)-1)/2)*s('Spacing X'),(Math.floor(idx/cols)-(rows-1)/2)*s('Spacing Y'),0];}
        else if(mode===2){var a=(s('Start Angle')+idx*360/Math.max(1,s('Radial Slots')||n))*rad;p=[Math.cos(a)*s('Radius'),Math.sin(a)*s('Radius'),0];}
        else if(mode===3){var closed=true;if(Math.round(s('Path Shape'))===5){try{closed=c.effect('GB Path Source')(1).mask(1).maskPath.isClosed();}catch(e){closed=false;}}p=pathPoint(idx/Math.max(1,closed?n:n-1));}
        else {p=focus(sphere(idx));for(var k=0;k<3;k++)p[k]*=s('Sphere Radius');}
        p[2]+=(idx+1-s('Z Anchor'))*s('Z Depth');return rot(p,s('Grid Rotation')*rad);
    }
    var modes;
    function point(idx){
        if(!modes)modes=segment(c.effect('GB Layout')(1));
        var a=layout(modes[0],idx);
        return modes[0]===modes[1]||modes[2]===0?a:vec(a,layout(modes[1],idx),modes[2]);
    }
    var raw;
    function position(){
        if(raw)return raw;
        raw=point(i);var random=s('Random Offset');
        if(random){seed=s('Seed');for(var k=0;k<3;k++)raw[k]+=(rand(i*3+k+101)*2-1)*random;}
        return raw;
    }
    // @end
    // @proximity
    var influences;
    function proximity(){
        if(influences)return influences;
        influences=[];
        for(var g=0;g<groups.length;g++){
            var group=groups[g],prefix='P'+group.id+' ',weight=0,nearest=null,nearestD=1e30;
            if(s(prefix+'Enabled')<0.5)continue;
            var p=position(),r=Math.max(0,s(prefix+'Radius')),fall=Math.max(0,s(prefix+'Falloff'));
            for(var e=0;e<group.effectors.length;e++){
                try{
                    var eff=c.effect('GB '+prefix+'E'+group.effectors[e])(1);
                    // Effectors created by GridBase are children of this controller.
                    // Position is already in grid space; avoid two world-matrix evaluations.
                    var ep=eff.parent&&eff.parent.index===c.index?eff.position:c.fromWorld(eff.toWorld(eff.anchorPoint));
                    var diff=sub(ep,p),dist=Math.sqrt(dot(diff,diff));
                    var w=dist<=r?1:fall?clamp(1-(dist-r)/fall,0,1):0;
                    weight=Math.max(weight,w*w*(3-2*w));
                    if(dist<nearestD){nearestD=dist;nearest=ep;}
                }catch(ignore){}
            }
            influences.push({id:group.id,prefix:prefix,weight:weight,nearest:nearest});
        }
        return influences;
    }
    // @end
    // @position
    if(kind==='position'){
        var p=position().slice(),inf=proximity();
        for(var g=0;g<inf.length;g++){
            var x=inf[g],attract=s(x.prefix+'Attract')/100*x.weight;
            for(var k=0;k<3;k++)p[k]+=s(x.prefix+['Move X','Move Y','Move Z'][k])*x.weight+(x.nearest?(x.nearest[k]-raw[k])*attract:0);
        }
        return [p[0]+value[0]-base[0],p[1]+value[1]-base[1],p[2]+(value[2]||0)-(base[2]||0)];
    }
    // @end
    // @scale
    if(kind==='scale'){
        var scale=s('Scale')/100,front=s('Scale Front'),back=s('Scale Back'),st=t;
        // Equal endpoints make all distribution geometry irrelevant.
        if(front!==back){
            var mode=Math.round(s('Scale Mode'));
            if(mode===1){var p=position(),direction=s('Scale Direction')*rad,extent=0;for(var j=0;j<n;j++){var pp=point(j);extent=Math.max(extent,Math.abs(pp[0]*Math.sin(direction)-pp[1]*Math.cos(direction)));}st=extent?clamp((p[0]*Math.sin(direction)-p[1]*Math.cos(direction)+extent)/(2*extent),0,1):0;}
            if(mode===2){var p=position(),f=segment(c.effect('GB Ripple Focus')(1)),center=vec(point(clamp(Math.round(f[0])-1,0,n-1)),point(clamp(Math.round(f[1])-1,0,n-1)),f[2]),delta=sub(p,center);st=clamp(Math.sqrt(dot(delta,delta))/Math.max(0.001,s('Scale Falloff')),0,1);}
        }
        scale*=mix(front,back,st)/100;
        var inf=proximity();for(var g=0;g<inf.length;g++){var x=inf[g];scale*=mix(s(x.prefix+'Scale Outside'),s(x.prefix+'Scale Inside'),x.weight)/100;}
        return [value[0]*scale,value[1]*scale,(value[2]===undefined?100:value[2])*scale];
    }
    // @end
    // @opacity
    if(kind==='opacity'){
        var alpha=s('Opacity')/100,inf=proximity();for(var g=0;g<inf.length;g++){var x=inf[g];alpha*=mix(s(x.prefix+'Opacity Outside'),s(x.prefix+'Opacity Inside'),x.weight)/100;}
        return clamp(value*alpha,0,100);
    }
    // @end
    // @orientation
    if(kind==='orientation'){
        var orient=[0,0,0],orientation=Math.round(s('Orientation'));
        if(orientation===1)orient=lookAt(position(),[0,0,0]);
        if(orientation===4)orient=lookAt([0,0,0],position());
        if(orientation===2){var camera=thisComp.activeCamera;orient=lookAt([0,0,0],c.fromWorldVec(camera?camera.toWorldVec([0,0,1]):[0,0,1]));}
        var inf=proximity();for(var g=0;g<inf.length;g++){var x=inf[g],blend=clamp(s(x.prefix+'Look At')/100*x.weight,0,1);if(x.nearest&&blend>0)orient=vec(orient,lookAt(position(),x.nearest),blend);}
        return [value[0]+orient[0],value[1]+orient[1],value[2]+orient[2]];
    }
    // @end
    // @rotation
    if(kind==='xRotation'||kind==='yRotation'||kind==='zRotation'){
        var axis=kind==='xRotation'?0:kind==='yRotation'?1:2;
        var twist=s('Twist '+['X','Y','Z'][axis]),stagger=s('Stagger');
        if(stagger){var sa=Math.round(s('Stagger Axis'));if(sa===0||sa===axis+1)twist+=stagger*t;}
        if(axis===2&&Math.round(s('Orientation'))===3){var u=i/Math.max(1,n),a=pathPoint(u-0.0001),b=pathPoint(u+0.0001);twist+=Math.atan2(b[1]-a[1],b[0]-a[0])/rad+s('Grid Rotation');}
        var inf=proximity();for(var g=0;g<inf.length;g++){var x=inf[g];twist+=s(x.prefix+'Rotate '+['X','Y','Z'][axis])*x.weight;}
        return value+twist;
    }
    // @end
    // @custom
    var inf=proximity();for(var g=0;g<inf.length;g++)if(inf[g].id===kind)return inf[g].weight;return 0;
    // @end
}

function gridBaseKernel(kind,hasGroups,constants,compiled){
    var keep={slot:kind!=='opacity',layout:true,proximity:hasGroups};
    keep[typeof kind==='number'?'custom':/Rotation$/.test(kind)?'rotation':kind]=true;
    if(!hasGroups&&(kind==='opacity'||kind==='xRotation'||kind==='yRotation'))keep.layout=false;
    var source=gridBaseEvaluate.toString().replace(/    \/\/ @(\w+)\n([\s\S]*?)    \/\/ @end\n/g,function(all,name,body){return keep[name]?body:'';});
    if(!hasGroups)source=source.replace(/proximity\(\)/g,'[]');
    if(kind==='xRotation'||kind==='yRotation')source=source.replace(/        if\(axis===2[^\n]+\n/,'');
    if(constants){
        source=source.replace('var cache={};','var cache='+JSON.stringify(constants)+';');
        source=source.replace(/segment\(c.effect\('GB (Layout|Focus Target|Ripple Focus)'\)\(1\)\)/g,function(all,name){return constants[name]===undefined?all:JSON.stringify([constants[name],constants[name],0]);});
    }
    if(compiled&&compiled.native){
        // EffectCraft 0.11 host adapter: request independent scalar values together.
        // The runtime resolves pending requests and retries the expression. This avoids
        // replaying the entire layout once for every nested property lookup.
        var map=compiled.map,cid=compiled.comp,lid=compiled.controller;
        var warm='var cache={},paths='+JSON.stringify(map)+',meta={};';
        warm+='function fetch(names){for(var j=0;j<names.length;j++){var name=names[j];if(cache[name]!==undefined)continue;try{cache[name]=__h(6,'+cid+','+lid+',paths[name],time,false);}catch(pending){if(String(pending).indexOf("pending host request")<0)throw pending;}}}';
        warm+='function keys(n){try{meta[n]=__h(5,'+cid+','+lid+',paths[n]);}catch(pending){if(String(pending).indexOf("pending host request")<0)throw pending;}}';
        var initial=kind==='position'?[]:kind==='scale'?['Scale','Scale Front','Scale Back','Scale Mode']:kind==='opacity'?['Opacity']:kind==='orientation'?['Orientation']:/Rotation$/.test(kind)?['Twist '+(kind==='xRotation'?'X':kind==='yRotation'?'Y':'Z'),'Stagger','Stagger Axis'].concat(kind==='zRotation'?['Orientation']:[]):[];
        warm+='fetch('+JSON.stringify(initial)+');';
        if(!hasGroups){
            if(kind==='opacity')warm+='return Math.max(0,Math.min(100,value*cache.Opacity/100));';
            if(kind==='scale')warm+='if(cache["Scale Front"]===cache["Scale Back"]){var factor=cache.Scale*cache["Scale Front"]/10000;return [value[0]*factor,value[1]*factor,(value[2]===undefined?100:value[2])*factor];}';
            if(kind==='orientation')warm+='if(cache.Orientation===0||cache.Orientation===3)return value;';
            if(/Rotation$/.test(kind))warm+='if(cache.Stagger===0'+(kind==='zRotation'?'&&Math.round(cache.Orientation)!==3':'')+')return value+cache["Twist '+(kind==='xRotation'?'X':kind==='yRotation'?'Y':'Z')+'"];';
        }
        var geometry=kind==='position'||hasGroups||typeof kind==='number'?'true':kind==='scale'?'cache["Scale Front"]!==cache["Scale Back"]&&cache["Scale Mode"]!==0':kind==='orientation'?'cache.Orientation===1||cache.Orientation===4':'false';
        warm+='if('+geometry+'){fetch(["Layout","Z Depth","Z Anchor","Grid Rotation","Random Offset"]);keys("Layout");var warmModes=meta.Layout?meta.Layout[5]:[cache.Layout];var modesNow=[cache.Layout];for(var j=0;j<warmModes.length;j++)modesNow.push(warmModes[j]);for(var j=0;j<modesNow.length;j++){var mode=Math.round(modesNow[j]);if(mode===1)fetch(["Columns","Spacing X","Spacing Y"]);if(mode===2)fetch(["Radius","Radial Slots","Start Angle"]);if(mode===3)fetch(["Path Shape","Path Width","Path Height","Polygon Points","Trim Start","Trim End","Path Progress"]);if(mode===4){fetch(["Sphere Radius","Focus Target"]);keys("Focus Target");}}}';
        if(kind!=='opacity')warm+='fetch(["Shuffle"]);if(cache.Shuffle||cache["Random Offset"])fetch(["Seed"]);';
        if(kind==='scale')warm+='if(cache["Scale Front"]!==cache["Scale Back"]){fetch(["Scale Direction","Ripple Focus","Scale Falloff"]);keys("Ripple Focus");}';
        if(kind==='zRotation')warm+='if(Math.round(cache.Orientation)===3)fetch(["Path Shape","Path Width","Path Height","Polygon Points","Trim Start","Trim End","Path Progress","Grid Rotation"]);';
        if(hasGroups)warm+='var proxNames=[];for(var name in paths)if(/^P[0-9]+ /.test(name))proxNames.push(name);fetch(proxNames);';
        warm+='function nativeSegment(n){var v=cache[n],info=meta[n];if(!info)return [v,v,0];var ts=info[4],vs=info[5];if(ts.length<2||time<=ts[0]||time>=ts[ts.length-1])return [v,v,0];var k=0;while(k+1<ts.length&&ts[k+1]<=time)k++;var a=Number(vs[k]),b=Number(vs[k+1]);return [a,b,a===b?0:Math.max(0,Math.min(1,(v-a)/(b-a)))];}';
        source=source.split("c.effect('GB Path Source')(1)").join("c.effect('GridBase')('Path')('Path Source')");
        source=source.replace(/var cache=\{[^;]*\};/,warm);
        source=source.replace("if(cache[n]===undefined)cache[n]=Number(c.effect('GB '+n)(1).value);","if(cache[n]===undefined)fetch([n]);");
        source=source.replace(/segment\(c.effect\('GB (Layout|Focus Target|Ripple Focus)'\)\(1\)\)/g,function(all,n){return 'nativeSegment('+JSON.stringify(n)+')';});
    }
    return source;
}
