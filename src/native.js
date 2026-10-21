/* EffectCraft 0.11 native property-tree adapter. No binary plugin or helper process. */
var GridBaseNative = (function () {
    function group(name, children) { return {node:'Group',uid:0,match:name,name:name,kind:{kind:'Plain'},enabled:true,children:children||[]}; }
    function leaf(s) {
        return {node:'Prop',uid:0,match:s[0],name:s[0],value:{t:'Scalar',v:s[1]},ui:{kind:'Slider',min:s[2],max:s[3],slider_min:Math.max(s[2],-1000),slider_max:Math.min(s[3],1000),decimals:/^(Columns|Radial Slots|Polygon Points|Seed|Shuffle|Orientation|Stagger Axis|Scale Mode|Path Shape)$/.test(s[0])?0:2}};
    }
    function exists(c) { return !!c.Effects.property('GridBase'); }
    function control(c,n,specs) {
        var e=c.Effects.property('GridBase');
        if(e)for(var i=0;i<specs.length;i++)if(specs[i][0]===n)return e.property(specs[i][4]).property(n);
        var old=c.Effects.property('GB '+n);return old?old.property(1):null;
    }
    function copy(p,q) {
        if(!p)return;
        if(!p.numKeys)q.setValue(p.valueAtTime(0,true));
        else for(var k=1;k<=p.numKeys;k++){
            q.setValueAtTime(p.keyTime(k),p.keyValue(k));
            q.setTemporalEaseAtKey(k,p.keyInTemporalEase(k),p.keyOutTemporalEase(k));
            q.setInterpolationTypeAtKey(k,p.keyInInterpolationType(k),p.keyOutInterpolationType(k));
            q.setTemporalContinuousAtKey(k,p.keyTemporalContinuous(k));
            q.setTemporalAutoBezierAtKey(k,p.keyTemporalAutoBezier(k));
        }
        if(p.expression){q.expression=p.expression;q.expressionEnabled=p.expressionEnabled;}
    }
    function install(c,specs) {
        if(exists(c))return;
        var children=[{node:'Prop',uid:0,match:'slider',name:'Internal',value:{t:'Scalar',v:0},ui:{kind:'Hidden'}}],groups={};
        for(var i=0;i<specs.length;i++){
            var s=specs[i],name=s[4];if(!groups[name]){groups[name]=group(name);children.push(groups[name]);}groups[name].children.push(leaf(s));
        }
        groups.Path.children.push({node:'Prop',uid:0,match:'Path Source',name:'Path Source',value:{t:'Layer',v:null},ui:{kind:'Layer'}});
        app.run('anim.applyPreset',{comp:c.containingComp.id,layers:[c.id],preset:{effectcraftAnimationPreset:1,properties:[],effects:[{uid:0,match:'ec.control.slider',name:'GridBase',kind:{kind:'Effect',effect:'ec.control.slider'},enabled:true,children:children}]}});
        for(var i=0;i<specs.length;i++){
            var old=c.Effects.property('GB '+specs[i][0]);if(old)copy(old.property(1),control(c,specs[i][0],specs));
        }
        var oldPath=c.Effects.property('GB Path Source');if(oldPath){copy(oldPath.property(1),c.Effects.property('GridBase').property('Path').property('Path Source'));oldPath.remove();}
        // Remove only our old slider effects after every value/key has been copied.
        for(var i=0;i<specs.length;i++){var old=c.Effects.property('GB '+specs[i][0]);if(old)old.remove();}
    }
    function path(p) { var a=[];while(p&&p.parentProperty){a.unshift('@'+p.__uid);p=p.parentProperty;}return a.join('/'); }
    function mapping(c,specs,prox,groups) {
        var out={};for(var i=0;i<specs.length;i++)out[specs[i][0]]=path(control(c,specs[i][0],specs));
        for(var g=0;g<groups.length;g++)for(var i=0;i<prox.length;i++){var n='P'+groups[g].id+' '+prox[i][0];out[n]=path(control(c,n,specs));}return out;
    }
    function reference(c){var e=c.Effects.property('GridBase');if(e)return {property:function(){return e.property('Path').property('Path Source');}};return c.Effects.property('GB Path Source');}
    return {exists:exists,install:install,control:control,mapping:mapping,reference:reference};
})();
