(function(thisObj){
    if(typeof GRIDBASE_NO_UI!=='undefined'&&GRIDBASE_NO_UI)return;
    var G=GridBase,ui=thisObj instanceof Panel?thisObj:new Window('palette','GridBase',undefined,{resizeable:true});
    ui.orientation='column';ui.alignChildren=['fill','top'];ui.spacing=6;ui.margins=10;
    var current=null,known=[],busy=false,fields=[],groupNumber=null,dragNumber=null,scrubSerial=0;
    var teal=[0.02,0.36,0.31,1],ink=[0.001,0.008,0.01,1];
    function row(p){var r=p.add('group');r.orientation='row';r.alignChildren=['left','center'];r.spacing=5;return r;}
    function label(p,t){return p.add('statictext',undefined,t);}
    function index(w){return w.selection?w.selection.index:-1;}
    function dropdown(p,items,id){return p.add('dropdownlist',undefined,items,{name:id});}
    function message(t){status.text=t;}
    function act(fn){try{fn();}catch(e){message(e.message);}}
    function roundedButtonPath(g,w,h){
        var inset=0.75,r=Math.max(0,Math.min(25,(w-2*inset)/2,(h-2*inset)/2));
        var centers=[[w-inset-r,inset+r],[w-inset-r,h-inset-r],[inset+r,h-inset-r],[inset+r,inset+r]];
        g.newPath();for(var c=0;c<4;c++)for(var s=0;s<=10;s++){var angle=(-90+c*90+s*9)*Math.PI/180,x=centers[c][0]+Math.cos(angle)*r,y=centers[c][1]+Math.sin(angle)*r;if(c===0&&s===0)g.moveTo(x,y);else g.lineTo(x,y);}g.closePath();
    }
    function paintButton(b,primary){b.onDraw=function(){var g=this.graphics,w=this.size.width||this.size[0],h=this.size.height||this.size[1];roundedButtonPath(g,w,h);if(primary)g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR,teal));else g.strokePath(g.newPen(g.PenType.SOLID_COLOR,teal,1.5));var m=g.measureString(this.text);g.drawString(this.text,g.newPen(g.PenType.SOLID_COLOR,primary?ink:teal,1),(w-m[0])/2,(h-m[1])/2);};return b;}
    function button(p,t,id,fn){var b=paintButton(p.add('button',undefined,t,{name:id}),id==='create');b.onClick=function(){act(fn);};return b;}
    function ctl(){if(!current)throw new Error('Select artwork, then create a grid.');if(current.containingComp.id!==G.comp().id)throw new Error('Composition changed. Click Refresh.');G.data(current);return current;}
    function section(p,title,id,open){
        var wrap=p.add('group');wrap.orientation='column';wrap.alignChildren=['fill','top'];wrap.spacing=4;
        var toggle=paintButton(wrap.add('button',undefined,(open?'−  ':'+  ')+title,{name:id}));toggle.alignment=['fill','top'];
        var body=wrap.add('group');body.orientation='column';body.alignChildren=['fill','top'];body.spacing=4;body.visible=!!open;
        toggle.onClick=function(){body.visible=!body.visible;toggle.text=(body.visible?'−  ':'+  ')+title;ui.layout.layout(true);};return body;
    }
    function spec(name,isProx){var a=isProx?G.proximityControls:G.controls;for(var i=0;i<a.length;i++)if(a[i][0]===name)return a[i];}
    function zeroBased(name){return name==='Orientation'||name==='Scale Mode'||name==='Stagger Axis'||name==='Shuffle';}
    function field(p,name,title,options,isProx){
        var r=row(p),l=label(r,title||name);l.preferredSize=[116,22];
        var id=(isProx?'prox_':'ctl_')+name.replace(/ /g,'_'),w=options?dropdown(r,options,id):r.add('button',undefined,'',{name:id});
        w.preferredSize=[options?158:88,24];if(!options)w.characters=9;
        var f={name:name,widget:w,options:options,prox:!!isProx,spec:spec(name,isProx)};fields.push(f);w.helpTip=f.spec[5]||'';
        var change=function(){if(busy)return;act(function(){
            var c=ctl(),n=f.prox?'P'+groupId()+' '+name:name,v=options?index(w)+(zeroBased(name)?0:1):Number(w.text);
            if(!isFinite(v)||!options&&w.text.replace(/\s/g,'')===''||v<f.spec[2]||v>f.spec[3])throw new Error('Enter '+f.spec[2]+' to '+f.spec[3]+' for '+name+'.');
            G.undo('Set '+name,function(){G.set(c,n,v,keyEdits.value);});if(name==='Layout')showLayout(v);
            message(name+' updated'+(keyEdits.value?' • keyframe at playhead':'')+'.');
        });};if(options)w.onChange=change;else{
            w.onDraw=function(){var g=this.graphics,width=this.size.width||this.size[0],height=this.size.height||this.size[1];g.newPath();g.rectPath(0,0,width,height);g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR,[0.01,0.014,0.016,1]));g.drawString(this.text,g.newPen(g.PenType.SOLID_COLOR,teal,1),8,5);};w.helpTip=(f.spec[5]||'')+' Drag left/right. Shift: fine; Alt: coarse. Click to type.';
            w.onClick=function(){if(w.dragged){w.dragged=false;return;}var dialog=new Window('dialog',title||name);dialog.orientation='column';dialog.alignChildren=['fill','top'];dialog.margins=16;label(dialog,'Enter '+f.spec[2]+' to '+f.spec[3]);var entry=dialog.add('edittext',undefined,w.text,{name:'numericEntry'});entry.characters=16;var buttons=row(dialog);var apply=button(buttons,'Apply','numericApply',function(){w.text=entry.text;change();dialog.close();});button(buttons,'Cancel','numericCancel',function(){dialog.close();});dialog.defaultElement=apply;dialog.show();};
            w.addEventListener('mousedown',function(e){if(e.button&&e.button!==0)return;var startValue=G.control(ctl(),f.prox?'P'+groupId()+' '+f.name:f.name).value;w.text=String(startValue);dragNumber={widget:w,field:f,start:e.screenX,value:Number(startValue),merge:'GridBase scrub '+(++scrubSerial),changed:false};w.dragged=false;});
        }return w;
    }
    var tabs=ui.add('tabbedpanel',undefined,undefined,{name:'tabs'});tabs.alignChildren=['fill','top'];
    function tab(t){var x=tabs.add('tab',undefined,t);x.orientation='column';x.alignChildren=['fill','top'];x.spacing=6;x.margins=[8,30,8,8];return x;}
    var gridTab=tab('Grid Builder'),proxTab=tab('Proximity');
    button(gridTab,'+  Grid from selected layers','create',function(){current=G.create(G.comp().selectedLayers,1);scan(current.id);message('Grid created. Change its layout below.');});
    var choose=row(gridTab),gridPick=dropdown(choose,[],'grid');gridPick.preferredSize=[205,25];
    button(choose,'Refresh','refresh',function(){scan();if(current){G.undo('Refresh rig',function(){G.refresh(ctl());});scan(current.id);}message('Grid refreshed.');});
    var blank=gridTab.add('group');blank.orientation='column';blank.alignChildren=['fill','top'];label(blank,'Select artwork in the timeline to start.');
    button(blank,'Try a 12-tile demo','demo',function(){current=G.demo();scan(current.id);message('Demo created.');});
    var manage=gridTab.add('group');manage.visible=false;manage.orientation='column';manage.alignChildren=['fill','top'];manage.spacing=5;
    var actions=row(manage);
    button(actions,'Edit controls','selectController',function(){if(G.needsUpgrade(ctl()))G.upgrade(ctl());G.select(ctl());app.run('window.panel',{panel:'effectControls'});readFields();message('Drag values in Effect Controls; double-click to type.');});
    button(actions,'Duplicate','duplicate',function(){current=G.duplicate(ctl());scan(current.id);message('Independent copy created.');});
    button(actions,'Release grid','releaseGrid',function(){G.dissolve(ctl());current=null;scan();message('Artwork restored to its original transforms.');});
    var upgrade=button(manage,'Upgrade to grouped controls','upgrade',function(){G.upgrade(ctl());scan(current.id);message('Grouped controls ready. Existing animation preserved.');});upgrade.visible=false;
    var membersHeader=row(manage),countLabel=label(membersHeader,'LAYERS');
    var allButton=button(membersHeader,'All','selectAll',function(){var ix=[];for(var i=0;i<list.items.length;i++)ix.push(i);list.selection=ix;selectionLabel();});
    var clearButton=button(membersHeader,'Clear','clearSelection',function(){list.selection=[];selectionLabel();});
    allButton.preferredSize=[42,25];clearButton.preferredSize=[50,25];countLabel.preferredSize=[165,20];
    var list=manage.add('listbox',undefined,[],{name:'members',multiselect:true});list.preferredSize=[290,224];
    var listOffset=0,rowHeight=28,listAnchor=-1,listDrag=null,dropRow=-1,scrollDrag=false;
    list.helpTip='Click to select. Ctrl-click to toggle; Shift-click for a range. Drag one row onto another to swap their grid slots. Drag the scrollbar for more layers.';
    function selectedIndices(){var a=list.selection||[],out=[];if(a.index!==undefined)a=[a];for(var i=0;i<a.length;i++)out.push(a[i].index);return out;}
    function selectionLabel(){countLabel.text=list.items.length+' LAYERS  /  '+selectedIndices().length+' selected';}
    function rowAt(e){var i=listOffset+Math.floor(e.clientY/rowHeight);return e.clientY>=0&&i>=0&&i<list.items.length?i:-1;}
    function visibleRows(){return Math.max(1,Math.floor((list.size.height||list.size[1]||224)/rowHeight));}
    function scrollTo(y){var height=list.size.height||list.size[1]||224;listOffset=Math.max(0,Math.min(list.items.length-visibleRows(),Math.floor(y/height*list.items.length)));}
    list.onDraw=function(){var g=this.graphics,w=this.size.width||this.size[0],h=this.size.height||this.size[1],sel=selectedIndices(),white=g.newPen(g.PenType.SOLID_COLOR,[0.86,0.89,0.89,1],1);g.newPath();g.rectPath(0,0,w,h);g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR,[0.01,0.014,0.016,1]));
        for(var j=0;j<visibleRows()&&listOffset+j<this.items.length;j++){var i=listOffset+j,y=j*rowHeight;if(sel.indexOf(i)>=0){g.newPath();g.rectPath(1,y+1,w-13,rowHeight-2);g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR,[0.08,0.30,0.29,1]));}if(i===dropRow){g.newPath();g.rectPath(2,y+2,w-15,rowHeight-4);g.strokePath(g.newPen(g.PenType.SOLID_COLOR,teal,2));}var text=(i+1)+'.  '+this.items[i].text;while(text.length>4&&g.measureString(text)[0]>w-34)text=text.slice(0,-2)+'…';g.drawString(text,white,12,y+6);}
        if(this.items.length>visibleRows()){var hh=Math.max(18,h*visibleRows()/this.items.length),yy=(h-hh)*listOffset/(this.items.length-visibleRows());g.newPath();g.rectPath(w-9,yy,6,hh);g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR,teal));}
    };
    list.addEventListener('mousedown',function(e){act(function(){if(e.button&&e.button!==0)return;var w=list.size.width||list.size[0];if(e.clientX>w-14){scrollDrag=true;scrollTo(e.clientY);return;}var at=rowAt(e);if(at<0)return;var sel=selectedIndices();if(e.shiftKey&&listAnchor>=0){if(!e.ctrlKey)sel=[];for(var j=Math.min(listAnchor,at);j<=Math.max(listAnchor,at);j++)if(sel.indexOf(j)<0)sel.push(j);}else if(e.ctrlKey||e.metaKey){var k=sel.indexOf(at);if(k<0)sel.push(at);else sel.splice(k,1);listAnchor=at;}else {if(sel.indexOf(at)<0)sel=[at];listAnchor=at;}list.selection=sel;listDrag={from:at,x:e.screenX,y:e.screenY,moved:false,modified:e.ctrlKey||e.shiftKey||e.metaKey};selectionLabel();});});
    list.addEventListener('mousemove',function(e){if(scrollDrag){scrollTo(e.clientY);return;}if(!listDrag)return;if(Math.abs(e.screenX-listDrag.x)+Math.abs(e.screenY-listDrag.y)>5)listDrag.moved=true;dropRow=listDrag.moved?rowAt(e):-1;var edge=e.clientY<12?-1:e.clientY>(list.size.height||list.size[1])-12?1:0,now=new Date().getTime();if(listDrag.moved&&edge&&(!listDrag.scrolled||now-listDrag.scrolled>180)){listOffset=Math.max(0,Math.min(Math.max(0,list.items.length-visibleRows()),listOffset+edge));dropRow=rowAt(e);listDrag.scrolled=now;}});
    list.addEventListener('mouseup',function(e){act(function(){scrollDrag=false;var drag=listDrag;listDrag=null;dropRow=-1;if(!drag)return;var target=rowAt(e);if(drag.moved&&target>=0&&target!==drag.from){G.swap(ctl(),drag.from,target);var off=listOffset;update();listOffset=off;list.selection=[target];message('Swapped slots '+(drag.from+1)+' and '+(target+1)+'.');}else if(!drag.moved&&!drag.modified)list.selection=[drag.from];selectionLabel();});});
    list.addEventListener('click',function(e){if(e.detail===2)act(function(){var ix=selectedIndices();if(ix.length===1)G.select(G.members(ctl())[ix[0]]);});});
    var memberActions=row(manage);
    button(memberActions,'Add selected','add',function(){G.add(ctl(),G.comp().selectedLayers);scan(current.id);message('Timeline layers added.');});
    button(memberActions,'Replace','replace',function(){var ls=G.comp().selectedLayers,ix=selectedIndices();if(!ix.length||ls.length!==1)throw new Error('Select grid slots here and one outside layer in the timeline.');G.replaceMany(ctl(),ix,ls[0]);scan(current.id);list.selection=ix;selectionLabel();message(ix.length+' slots replaced with copies. Source kept.');});
    button(memberActions,'Remove','releaseMember',function(){var ix=selectedIndices();G.removeMany(ctl(),ix);scan(current.id);message(ix.length+' layers released from the grid.');});
    var layout=field(manage,'Layout','Layout',['Rectangular','Radial','Path','Spherical']);
    var pathButton=button(manage,'Edit mask guide','pathTemplate',function(){G.template(ctl());readFields();message('Edit the first mask on the selected guide.');});pathButton.visible=false;
    var nameField=null,presetPick=null;
    button(manage,'Name & presets…','settings',function(){
    var settingsWindow=new Window('dialog','GridBase settings');settingsWindow.orientation='column';settingsWindow.alignChildren=['fill','top'];settingsWindow.margins=16;
    var saved=settingsWindow,nameRow=row(saved);label(nameRow,'Grid name');nameField=nameRow.add('edittext',undefined,'',{name:'gridName'});nameField.characters=17;
    nameField.onChange=function(){if(busy)return;act(function(){var n=nameField.text.replace(/^\s+|\s+$/g,'');if(!n)throw new Error('Enter a name.');G.undo('Rename',function(){ctl().name=n;});scan(current.id);});};
    var presetRow=row(saved),presetName=presetRow.add('edittext',undefined,'My preset',{name:'presetName'});presetName.characters=14;
    button(presetRow,'Save','savePreset',function(){var p=presets(),v={},c=ctl();for(var i=0;i<G.controls.length;i++)v[G.controls[i][0]]=G.control(c,G.controls[i][0]).value;p[presetName.text]=v;app.settings.saveSetting('GridBase','presets',JSON.stringify(p));presetList();message('Preset saved.');});
    var presetLoad=row(saved);presetPick=dropdown(presetLoad,[],'presets');presetPick.preferredSize=[185,24];
    button(presetLoad,'Load','loadPreset',function(){if(!presetPick.selection)throw new Error('Save a preset first.');var c=ctl(),p=presets()[presetPick.selection.text];G.undo('Load preset',function(){for(var n in p)if(p.hasOwnProperty(n))G.set(c,n,p[n]);});readFields();message('Preset applied.');});
    button(settingsWindow,'Reset numeric controls','resetValues',function(){var c=ctl();G.undo('Reset control values',function(){for(var i=0;i<G.controls.length;i++)G.set(c,G.controls[i][0],G.controls[i][1],keyEdits.value);});readFields();message('Control values reset at the playhead.');});
    button(settingsWindow,'Done','doneSettings',function(){settingsWindow.close();});
    nameField.text=ctl().name;presetList();settingsWindow.onClose=function(){nameField=null;presetPick=null;};settingsWindow.show();
    });
    function presets(){try{return JSON.parse(app.settings.getSetting('GridBase','presets'));}catch(e){return {};}}
    function presetList(){if(!presetPick)return;presetPick.removeAll();var p=presets();for(var n in p)if(p.hasOwnProperty(n))presetPick.add('item',n);if(presetPick.items.length)presetPick.selection=0;}
    var proxTitle=label(proxTab,'Choose a grid on the Grid Builder tab.');
    var groupRow=row(proxTab),groupPick=dropdown(groupRow,[],'group');groupPick.preferredSize=[160,25];
    button(groupRow,'+ Group','newGroup',function(){var id=G.newGroup(ctl());groupList(id);readFields();message('Move the selected effector to affect nearby layers.');});
    var proxBody=proxTab.add('group');proxBody.visible=false;proxBody.orientation='column';proxBody.alignChildren=['fill','top'];proxBody.spacing=5;
    var efRow=row(proxBody);button(efRow,'Add effector','addEffector',function(){G.addEffector(ctl(),groupId());groupList(groupNumber);message('New effector selected.');});
    button(efRow,'Select effector','selectEffector',function(){var g=G.data(ctl()).groups[index(groupPick)],ix=current.Effects.property('GB P'+g.id+' E'+g.effectors[0]).property(1).value;G.select(current.containingComp.layer(ix));});
    var enable=proxBody.add('checkbox',undefined,'Enable group',{name:'proxEnabled'});enable.onClick=function(){act(function(){G.undo('Toggle proximity',function(){G.set(ctl(),'P'+groupId()+' Enabled',enable.value?1:0);});});};
    field(proxBody,'Radius','Radius (px)',null,true);field(proxBody,'Falloff','Falloff (px)',null,true);
    var proxScale=section(proxBody,'Scale & opacity','proxScale',true);field(proxScale,'Scale Inside','Inside scale (%)',null,true);field(proxScale,'Scale Outside','Outside scale (%)',null,true);field(proxScale,'Opacity Inside','Inside opacity (%)',null,true);field(proxScale,'Opacity Outside','Outside opacity (%)',null,true);
    var proxMove=section(proxBody,'Position & rotation','proxMotion',false),pn=['Move X','Move Y','Move Z','Rotate X','Rotate Y','Rotate Z','Attract','Look At'];for(var i=0;i<pn.length;i++)field(proxMove,pn[i],null,null,true);
    var custom=section(proxBody,'Custom properties','proxCustom',false);field(custom,'Custom Outside','Outside value',null,true);field(custom,'Custom Inside','Inside value',null,true);
    button(custom,'Link selected numeric properties','linkCustom',function(){var n=G.link(ctl(),groupId(),G.comp().selectedProperties);message(n+' member properties linked.');});
    button(proxBody,'Remove group','removeGroup',function(){G.undo('Remove proximity',function(){G.removeGroup(ctl(),groupId());});groupList();readFields();message('Group removed; linked properties restored.');});
    var footer=row(ui),keyEdits=footer.add('checkbox',undefined,'Keyframe edits',{name:'keyEdits'});
    var status=ui.add('statictext',undefined,'Select artwork, then create a grid.',{multiline:true,name:'status'});status.preferredSize=[290,34];
    function groupId(){if(groupNumber===null)throw new Error('Create a proximity group first.');return groupNumber;}
    function groupList(want){var prev=busy;busy=true;try{groupPick.removeAll();groupNumber=null;var gs=current?G.data(current).groups:[];for(var i=0;i<gs.length;i++){groupPick.add('item','Group '+gs[i].id);if(gs[i].id===want)groupPick.selection=i;}if(index(groupPick)<0&&gs.length)groupPick.selection=0;if(index(groupPick)>=0)groupNumber=gs[index(groupPick)].id;proxBody.visible=groupNumber!==null;proxTitle.text=current?current.name:'Choose a grid on the Grid Builder tab.';}finally{busy=prev;}}
    function showLayout(v){pathButton.visible=Math.round(v)===3;ui.layout.layout(true);}
    function readFields(){var prev=busy;busy=true;try{if(!current)return;for(var i=0;i<fields.length;i++){var f=fields[i];if(f.prox&&groupNumber===null)continue;var v=G.control(current,f.prox?'P'+groupNumber+' '+f.name:f.name).value;if(f.options)f.widget.selection=Math.round(v)-(zeroBased(f.name)?0:1);else f.widget.text=String(Math.round(v*1000)/1000);}if(groupNumber!==null)enable.value=G.control(current,'P'+groupNumber+' Enabled').value>=0.5;if(nameField)nameField.text=current.name;showLayout(G.control(current,'Layout').value);}finally{busy=prev;}}
    function update(){list.removeAll();manage.visible=!!current;blank.visible=!current;if(current){var ls=G.members(current);for(var i=0;i<ls.length;i++)list.add('item',ls[i].name);listOffset=0;selectionLabel();upgrade.visible=G.needsUpgrade(current);}groupList();readFields();ui.layout.layout(true);}
    function scan(want){busy=true;try{known=G.grids();gridPick.removeAll();var selected=-1;for(var i=0;i<known.length;i++){gridPick.add('item',known[i].name);if(known[i].id===(want||current&&current.id))selected=i;}if(selected<0&&known.length)selected=0;gridPick.selection=selected;current=selected>=0?known[selected]:null;update();}catch(e){current=null;known=[];gridPick.removeAll();update();throw e;}finally{busy=false;}}
    gridPick.onChange=function(){if(busy)return;current=known[index(gridPick)]||null;act(update);};
    groupPick.onChange=function(){if(busy)return;act(function(){var gs=G.data(ctl()).groups;groupNumber=index(groupPick)<0?null:gs[index(groupPick)].id;proxBody.visible=groupNumber!==null;readFields();});};
    ui.addEventListener('mousemove',function(e){if(!dragNumber)return;act(function(){var d=dragNumber,dx=e.screenX-d.start;if(Math.abs(dx)<3&&!d.changed)return;d.changed=true;d.widget.dragged=true;var f=d.field,step=/^(Columns|Radial Slots|Polygon Points|Seed)$/.test(f.name)?1:(e.shiftKey?0.1:e.altKey?10:1),v=Math.max(f.spec[2],Math.min(f.spec[3],Math.round((d.value+dx*step)*100)/100)),c=ctl(),n=f.prox?'P'+groupId()+' '+f.name:f.name,p=G.control(c,n);d.widget.text=String(v);if(GridBaseNative.exists(c)){app.run(keyEdits.value||p.numKeys?'prop.addKey':'prop.set',{comp:c.containingComp.id,layer:c.id,prop:p.__uid,value:v,time:c.containingComp.time,timeBase:'comp',merge:d.merge});}else G.undo('Scrub '+n,function(){G.set(c,n,v,keyEdits.value);});});});
    ui.addEventListener('mouseup',function(e){dragNumber=null;if(e.target!==list){listDrag=null;dropRow=-1;scrollDrag=false;}});
    ui.addEventListener('mouseout',function(e){if(e.target===ui){dragNumber=null;listDrag=null;dropRow=-1;scrollDrag=false;}});
    // EffectCraft 0.11.1 exposes scheduleTask, but desktop repeat tasks do not run.
    // Refresh on pointer movement instead; never write project data from a UI refresh.
    var lastRead=0;ui.addEventListener('mousemove',function(){var now=new Date().getTime();if(busy||dragNumber||listDrag||scrollDrag||!current||now-lastRead<750)return;lastRead=now;try{readFields();}catch(ignore){}});
    presetList();act(scan);if(current)message('Ctrl / Shift to select · Drag rows to swap.');ui.onResizing=ui.onResize=function(){this.layout.resize();};
    if(ui instanceof Window)ui.show();else ui.layout.layout(true);
})(this);
