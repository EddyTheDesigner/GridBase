var checks=0;
function ok(v,message){if(!v)throw new Error('FAIL: '+message);checks++;}
function near(a,b,message){ok(Math.abs(a-b)<0.001,message+' ('+a+' vs '+b+')');}
function pos(l){var p=l.transform.position;var v=p.value;ok(!p.expressionError,l.name+' position expression: '+p.expressionError);return v;}
function clean(l){var names=['position','scale','opacity','orientation','xRotation','yRotation','zRotation'];for(var j=0;j<names.length;j++){var p=l.transform.property(names[j]==='zRotation'?'ADBE Rotate Z':names[j]);var v=p.value;ok(!p.expressionError,l.name+' '+names[j]+': '+p.expressionError);}}
var c=app.project.items.addComp('GridBase verification',1280,720,1,5,30);c.openInViewer();
var artwork=[];for(var i=0;i<8;i++)artwork.push(c.layers.addSolid([0.2,0.8,0.7],'Tile '+i,60,60,1));
artwork[0].comment='User note';artwork[0].transform.position.setValueAtTime(0,[640,360]);artwork[0].transform.position.setValueAtTime(2,[680,380]);
var oldParent=c.layers.addNull();artwork[1].setParentWithJump(oldParent);var original1=artwork[1].transform.position.value;
var ctl=GridBase.create(artwork,1,'Verification grid');
near(pos(artwork[0])[0],-210,'rectangular first X');near(pos(artwork[0])[1],-70,'rectangular first Y');near(pos(artwork[7])[0],210,'rectangular last X');near(pos(artwork[7])[1],70,'rectangular last Y');
for(var mode=1;mode<=4;mode++){GridBase.set(ctl,'Layout',mode);for(var j=0;j<artwork.length;j++)clean(artwork[j]);}
GridBase.set(ctl,'Layout',2);near(pos(artwork[0])[1],-300,'radial radius');
GridBase.set(ctl,'Layout',4);var p=pos(artwork[2]);near(Math.sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]),300,'sphere surface');
GridBase.set(ctl,'Focus Target',3);near(pos(artwork[2])[2],-300,'sphere focus target faces front');GridBase.set(ctl,'Focus Target',0);
GridBase.set(ctl,'Layout',3);for(var sh=1;sh<=4;sh++){GridBase.set(ctl,'Path Shape',sh);for(var j=0;j<artwork.length;j++)clean(artwork[j]);}
GridBase.template(ctl);near(pos(artwork[0])[0],-300,'custom mask X');near(pos(artwork[0])[1],-160,'custom mask Y');
for(var ori=0;ori<=4;ori++){GridBase.set(ctl,'Orientation',ori);clean(artwork[2]);}GridBase.set(ctl,'Orientation',0);
// Morph keys must blend the endpoints, skipping intermediate modes.
GridBase.set(ctl,'Layout',1);var a=pos(artwork[2]);GridBase.set(ctl,'Layout',4);var b=pos(artwork[2]);var layout=GridBase.control(ctl,'Layout');layout.setValueAtTime(0,1);layout.setValueAtTime(2,4);GridBase.refresh(ctl);c.time=1;var p=pos(artwork[2]);for(var j=0;j<3;j++)near(p[j],(a[j]+b[j])/2,'direct morph axis '+j);c.time=0;while(layout.numKeys)layout.removeKey(1);layout.setValue(1);GridBase.refresh(ctl);
// The original position animation remains underneath the rig.
c.time=1;near(pos(artwork[0])[0],-190,'original X animation preserved');c.time=0;
GridBase.set(ctl,'Shuffle',1);GridBase.set(ctl,'Random Offset',35);var seeded=pos(artwork[3]);GridBase.refresh(ctl);var again=pos(artwork[3]);for(var j=0;j<3;j++)near(again[j],seeded[j],'deterministic seed axis '+j);GridBase.set(ctl,'Shuffle',0);GridBase.set(ctl,'Random Offset',0);
for(var sm=0;sm<=2;sm++){GridBase.set(ctl,'Scale Mode',sm);GridBase.set(ctl,'Scale Back',50);clean(artwork[2]);}GridBase.set(ctl,'Scale Back',100);
// Proximity is evaluated against the undisplaced layout to avoid feedback loops.
var gid=GridBase.newGroup(ctl),d=GridBase.data(ctl),efIndex=ctl.Effects.property('GB P1 E1').property(1).value,eff=c.layer(efIndex);
eff.transform.position.setValue(pos(artwork[2]));GridBase.set(ctl,'P1 Radius',1);GridBase.set(ctl,'P1 Falloff',0);near(artwork[2].transform.scale.value[0],150,'inside proximity scale');near(artwork[7].transform.scale.value[0],100,'outside proximity scale');
GridBase.set(ctl,'P1 Move X',50);near(pos(artwork[2])[0],120,'proximity position offset');GridBase.set(ctl,'P1 Look At',100);clean(artwork[2]);
var e2=GridBase.addEffector(ctl,1);e2.transform.position.setValue([210,70,0]);near(artwork[7].transform.scale.value[0],150,'second effector');
var gid2=GridBase.newGroup(ctl);GridBase.set(ctl,'P2 Scale Inside',100);GridBase.set(ctl,'P2 Opacity Inside',50);clean(artwork[2]);
var blur=artwork[2].Effects.addProperty('ADBE Slider Control');blur.name='Custom target';var custom=blur.property(1);custom.setValue(7);GridBase.link(ctl,1,[custom]);near(custom.value,100,'custom property inside');ok(!custom.expressionError,'custom expression valid');
// Controller rename and composition stack changes must not break membership.
ctl.name='Renamed controller';artwork[2].moveToBeginning();near(artwork[2].transform.scale.value[0],150,'rename and stack reorder stable');
var dup=GridBase.duplicate(ctl);ok(GridBase.members(dup).length===8,'duplicate count');var dupl=GridBase.members(dup);for(var j=0;j<dupl.length;j++)clean(dupl[j]);GridBase.set(dup,'Spacing X',200);ok(pos(dupl[0])[0]!==pos(artwork[0])[0],'duplicate independent');
var before=artwork[0].index;GridBase.reorder(ctl,0,7);ok(artwork[0].index===before,'member order leaves timeline order alone');ok(GridBase.members(ctl)[7].id===artwork[0].id,'member order persisted');
var extra=c.layers.addText('New member');GridBase.add(ctl,[extra]);ok(GridBase.members(ctl).length===9,'add member');var replacement=c.layers.addSolid([1,0.5,0.2],'Replacement',70,70,1);GridBase.replace(ctl,8,replacement);ok(!extra.parent,'replaced layer released');
GridBase.removeGroup(ctl,1);near(custom.value,7,'custom property restored');ok(custom.expression==='','custom expression removed');
GridBase.remove(ctl,0);ok(artwork[1].parent.id===oldParent.id,'original parent restored');near(artwork[1].transform.position.value[0],original1[0],'original position restored');
GridBase.dissolve(ctl);ok(artwork[0].comment==='User note','user comment restored');ok(!artwork[0].threeDLayer,'original 2D switch restored');ok(artwork[0].transform.position.numKeys===2,'original keys retained');ok(artwork[0].transform.position.expression==='','original expression state restored');
// Save a surviving rig for separate-process reopen verification.
app.project.save(new File(TEST_OUTPUT));writeLn('PASS '+checks+' assertions');
