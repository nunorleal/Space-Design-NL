import{c as ne,r as d,b as Ye,d as Ue,j as h,v as Be,s as zt,e as St,f as Yt,g as Ut,a as He,o as We,h as Fe,k as Ge,l as Xt,n as Ne,p as ie,q as qt,w as $t,t as je,V as qe,B as $e,m as Bt,M as Je,P as Ke,C as tn,u as ze,x as en}from"./index-Bdnp-mwS.js";import{u as T,e as At,V as v,_ as Et,D as se,f as oe,P as Vt,O as Mt,R as nn,g as Pt,E as sn,h as re,Q as K,C as Lt,i as Le,L as on,j as ct,B as gt,k as Ht,F as It,l as j,m as k,n as yt,o as wt,S as rn,T as Rt,p as an,I as ln,q as Jt,r as bt,W as cn,s as ae,t as Ie,v as hn,U as ue,w as pe,x as jt,y as dn,z as un,A as pn,G as fn,H as mn,J as fe,K as gn,N as wn,X as yn,d as xn,c as vn,a as bn,Y as Sn,Z as Mn,$ as En,a0 as Pn,a1 as jn}from"./ModelPreview-CtEQRkWj.js";import{p as zn}from"./gltfDocument-CKfgiM3R.js";const Ln=ne("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);const In=ne("Move",[["path",{d:"M12 2v20",key:"t6zp3m"}],["path",{d:"m15 19-3 3-3-3",key:"11eu04"}],["path",{d:"m19 9 3 3-3 3",key:"1mg7y2"}],["path",{d:"M2 12h20",key:"9i4pu4"}],["path",{d:"m5 9-3 3 3 3",key:"j64kie"}],["path",{d:"m9 5 3-3 3 3",key:"l8vdw6"}]]);const An=ne("RotateCw",[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]]),_t=new v,le=new v,_n=new v,me=new oe;function Cn(t,e,i){const o=_t.setFromMatrixPosition(t.matrixWorld);o.project(e);const n=i.width/2,s=i.height/2;return[o.x*n+n,-(o.y*s)+s]}function Dn(t,e){const i=_t.setFromMatrixPosition(t.matrixWorld),o=le.setFromMatrixPosition(e.matrixWorld),n=i.sub(o),s=e.getWorldDirection(_n);return n.angleTo(s)>Math.PI/2}function Rn(t,e,i,o){const n=_t.setFromMatrixPosition(t.matrixWorld),s=n.clone();s.project(e),me.set(s.x,s.y),i.setFromCamera(me,e);const l=i.intersectObjects(o,!0);if(l.length){const r=l[0].distance;return n.distanceTo(i.ray.origin)<r}return!0}function On(t,e){if(e instanceof Mt)return e.zoom;if(e instanceof Vt){const i=_t.setFromMatrixPosition(t.matrixWorld),o=le.setFromMatrixPosition(e.matrixWorld),n=e.fov*Math.PI/180,s=i.distanceTo(o);return 1/(2*Math.tan(n/2)*s)}else return 1}function kn(t,e,i){if(e instanceof Vt||e instanceof Mt){const o=_t.setFromMatrixPosition(t.matrixWorld),n=le.setFromMatrixPosition(e.matrixWorld),s=o.distanceTo(n),l=(i[1]-i[0])/(e.far-e.near),r=i[1]-l*e.far;return Math.round(l*s+r)}}const Kt=t=>Math.abs(t)<1e-10?0:t;function Ae(t,e,i=""){let o="matrix3d(";for(let n=0;n!==16;n++)o+=Kt(e[n]*t.elements[n])+(n!==15?",":")");return i+o}const Tn=(t=>e=>Ae(e,t))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),Qn=(t=>(e,i)=>Ae(e,t(i),"translate(-50%,-50%)"))(t=>[1/t,1/t,1/t,1,-1/t,-1/t,-1/t,-1,1/t,1/t,1/t,1,1,1,1,1]);function Xn(t){return t&&typeof t=="object"&&"current"in t}const Vn=d.forwardRef(({children:t,eps:e=.001,style:i,className:o,prepend:n,center:s,fullscreen:l,portal:r,distanceFactor:f,sprite:p=!1,transform:w=!1,occlude:y,onOcclude:E,castShadow:u,receiveShadow:S,material:b,geometry:m,zIndexRange:g=[16777271,0],calculatePosition:z=Cn,as:x="div",wrapperClass:L,pointerEvents:A="auto",..._},P)=>{const{gl:X,camera:Y,scene:rt,size:H,raycaster:J,events:V,viewport:G}=T(),[I]=d.useState(()=>document.createElement(x)),it=d.useRef(null),B=d.useRef(null),st=d.useRef(0),W=d.useRef([0,0]),Q=d.useRef(null),M=d.useRef(null),R=r?.current||V.connected||X.domElement.parentNode,O=d.useRef(null),a=d.useRef(!1),U=d.useMemo(()=>y&&y!=="blending"||Array.isArray(y)&&y.length&&Xn(y[0]),[y]);d.useLayoutEffect(()=>{const F=X.domElement;y&&y==="blending"?(F.style.zIndex=`${Math.floor(g[0]/2)}`,F.style.position="absolute",F.style.pointerEvents="none"):(F.style.zIndex=null,F.style.position=null,F.style.pointerEvents=null)},[y]),d.useLayoutEffect(()=>{if(B.current){const F=it.current=Ye.createRoot(I);if(rt.updateMatrixWorld(),w)I.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{const Z=z(B.current,Y,H);I.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${Z[0]}px,${Z[1]}px,0);transform-origin:0 0;`}return R&&(n?R.prepend(I):R.appendChild(I)),()=>{R&&R.removeChild(I),F.unmount()}}},[R,w]),d.useLayoutEffect(()=>{L&&(I.className=L)},[L]);const tt=d.useMemo(()=>w?{position:"absolute",top:0,left:0,width:H.width,height:H.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:s?"translate3d(-50%,-50%,0)":"none",...l&&{top:-H.height/2,left:-H.width/2,width:H.width,height:H.height},...i},[i,s,l,H,w]),ot=d.useMemo(()=>({position:"absolute",pointerEvents:A}),[A]);d.useLayoutEffect(()=>{if(a.current=!1,w){var F;(F=it.current)==null||F.render(d.createElement("div",{ref:Q,style:tt},d.createElement("div",{ref:M,style:ot},d.createElement("div",{ref:P,className:o,style:i,children:t}))))}else{var Z;(Z=it.current)==null||Z.render(d.createElement("div",{ref:P,style:tt,className:o,children:t}))}});const et=d.useRef(!0);At(F=>{if(B.current){Y.updateMatrixWorld(),B.current.updateWorldMatrix(!0,!1);const Z=w?W.current:z(B.current,Y,H);if(w||Math.abs(st.current-Y.zoom)>e||Math.abs(W.current[0]-Z[0])>e||Math.abs(W.current[1]-Z[1])>e){const lt=Dn(B.current,Y);let at=!1;U&&(Array.isArray(y)?at=y.map(nt=>nt.current):y!=="blending"&&(at=[rt]));const C=et.current;if(at){const nt=Rn(B.current,Y,J,at);et.current=nt&&!lt}else et.current=!lt;C!==et.current&&(E?E(!et.current):I.style.display=et.current?"block":"none");const ft=Math.floor(g[0]/2),Ct=y?U?[g[0],ft]:[ft-1,0]:g;if(I.style.zIndex=`${kn(B.current,Y,Ct)}`,w){const[nt,Dt]=[H.width/2,H.height/2],Zt=Y.projectionMatrix.elements[5]*Dt,{isOrthographicCamera:de,top:ke,left:Te,bottom:Qe,right:Xe}=Y,Ve=Tn(Y.matrixWorldInverse),Ze=de?`scale(${Zt})translate(${Kt(-(Xe+Te)/2)}px,${Kt((ke+Qe)/2)}px)`:`translateZ(${Zt}px)`;let mt=B.current.matrixWorld;p&&(mt=Y.matrixWorldInverse.clone().transpose().copyPosition(mt).scale(B.current.scale),mt.elements[3]=mt.elements[7]=mt.elements[11]=0,mt.elements[15]=1),I.style.width=H.width+"px",I.style.height=H.height+"px",I.style.perspective=de?"":`${Zt}px`,Q.current&&M.current&&(Q.current.style.transform=`${Ze}${Ve}translate(${nt}px,${Dt}px)`,M.current.style.transform=Qn(mt,1/((f||10)/400)))}else{const nt=f===void 0?1:On(B.current,Y)*f;I.style.transform=`translate3d(${Z[0]}px,${Z[1]}px,0) scale(${nt})`}W.current=Z,st.current=Y.zoom}}if(!U&&O.current&&!a.current)if(w){if(Q.current){const Z=Q.current.children[0];if(Z!=null&&Z.clientWidth&&Z!=null&&Z.clientHeight){const{isOrthographicCamera:lt}=Y;if(lt||m)_.scale&&(Array.isArray(_.scale)?_.scale instanceof v?O.current.scale.copy(_.scale.clone().divideScalar(1)):O.current.scale.set(1/_.scale[0],1/_.scale[1],1/_.scale[2]):O.current.scale.setScalar(1/_.scale));else{const at=(f||10)/400,C=Z.clientWidth*at,ft=Z.clientHeight*at;O.current.scale.set(C,ft,1)}a.current=!0}}}else{const Z=I.children[0];if(Z!=null&&Z.clientWidth&&Z!=null&&Z.clientHeight){const lt=1/G.factor,at=Z.clientWidth*lt,C=Z.clientHeight*lt;O.current.scale.set(at,C,1),a.current=!0}O.current.lookAt(F.camera.position)}});const ht=d.useMemo(()=>({vertexShader:w?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[w]);return d.createElement("group",Et({},_,{ref:B}),y&&!U&&d.createElement("mesh",{castShadow:u,receiveShadow:S,ref:O},m||d.createElement("planeGeometry",null),b||d.createElement("shaderMaterial",{side:se,vertexShader:ht.vertexShader,fragmentShader:ht.fragmentShader})))}),_e=parseInt(nn.replace(/\D+/g,"")),Ce=_e>=125?"uv1":"uv2";var Zn=Object.defineProperty,Yn=(t,e,i)=>e in t?Zn(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i,c=(t,e,i)=>(Yn(t,typeof e!="symbol"?e+"":e,i),i);let Un=class extends Pt{constructor(e,i){super(),c(this,"isTransformControls",!0),c(this,"visible",!1),c(this,"domElement"),c(this,"raycaster",new an),c(this,"gizmo"),c(this,"plane"),c(this,"tempVector",new v),c(this,"tempVector2",new v),c(this,"tempQuaternion",new K),c(this,"unit",{X:new v(1,0,0),Y:new v(0,1,0),Z:new v(0,0,1)}),c(this,"pointStart",new v),c(this,"pointEnd",new v),c(this,"offset",new v),c(this,"rotationAxis",new v),c(this,"startNorm",new v),c(this,"endNorm",new v),c(this,"rotationAngle",0),c(this,"cameraPosition",new v),c(this,"cameraQuaternion",new K),c(this,"cameraScale",new v),c(this,"parentPosition",new v),c(this,"parentQuaternion",new K),c(this,"parentQuaternionInv",new K),c(this,"parentScale",new v),c(this,"worldPositionStart",new v),c(this,"worldQuaternionStart",new K),c(this,"worldScaleStart",new v),c(this,"worldPosition",new v),c(this,"worldQuaternion",new K),c(this,"worldQuaternionInv",new K),c(this,"worldScale",new v),c(this,"eye",new v),c(this,"positionStart",new v),c(this,"quaternionStart",new K),c(this,"scaleStart",new v),c(this,"camera"),c(this,"object"),c(this,"enabled",!0),c(this,"axis",null),c(this,"mode","translate"),c(this,"translationSnap",null),c(this,"rotationSnap",null),c(this,"scaleSnap",null),c(this,"space","world"),c(this,"size",1),c(this,"dragging",!1),c(this,"showX",!0),c(this,"showY",!0),c(this,"showZ",!0),c(this,"changeEvent",{type:"change"}),c(this,"mouseDownEvent",{type:"mouseDown",mode:this.mode}),c(this,"mouseUpEvent",{type:"mouseUp",mode:this.mode}),c(this,"objectChangeEvent",{type:"objectChange"}),c(this,"intersectObjectWithRay",(n,s,l)=>{const r=s.intersectObject(n,!0);for(let f=0;f<r.length;f++)if(r[f].object.visible||l)return r[f];return!1}),c(this,"attach",n=>(this.object=n,this.visible=!0,this)),c(this,"detach",()=>(this.object=void 0,this.visible=!1,this.axis=null,this)),c(this,"reset",()=>this.enabled?(this.dragging&&this.object!==void 0&&(this.object.position.copy(this.positionStart),this.object.quaternion.copy(this.quaternionStart),this.object.scale.copy(this.scaleStart),this.dispatchEvent(this.changeEvent),this.dispatchEvent(this.objectChangeEvent),this.pointStart.copy(this.pointEnd)),this):this),c(this,"updateMatrixWorld",()=>{this.object!==void 0&&(this.object.updateMatrixWorld(),this.object.parent===null?console.error("TransformControls: The attached 3D object must be a part of the scene graph."):this.object.parent.matrixWorld.decompose(this.parentPosition,this.parentQuaternion,this.parentScale),this.object.matrixWorld.decompose(this.worldPosition,this.worldQuaternion,this.worldScale),this.parentQuaternionInv.copy(this.parentQuaternion).invert(),this.worldQuaternionInv.copy(this.worldQuaternion).invert()),this.camera.updateMatrixWorld(),this.camera.matrixWorld.decompose(this.cameraPosition,this.cameraQuaternion,this.cameraScale),this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize(),super.updateMatrixWorld()}),c(this,"pointerHover",n=>{if(this.object===void 0||this.dragging===!0)return;this.raycaster.setFromCamera(n,this.camera);const s=this.intersectObjectWithRay(this.gizmo.picker[this.mode],this.raycaster);s?this.axis=s.object.name:this.axis=null}),c(this,"pointerDown",n=>{if(!(this.object===void 0||this.dragging===!0||n.button!==0)&&this.axis!==null){this.raycaster.setFromCamera(n,this.camera);const s=this.intersectObjectWithRay(this.plane,this.raycaster,!0);if(s){let l=this.space;if(this.mode==="scale"?l="local":(this.axis==="E"||this.axis==="XYZE"||this.axis==="XYZ")&&(l="world"),l==="local"&&this.mode==="rotate"){const r=this.rotationSnap;this.axis==="X"&&r&&(this.object.rotation.x=Math.round(this.object.rotation.x/r)*r),this.axis==="Y"&&r&&(this.object.rotation.y=Math.round(this.object.rotation.y/r)*r),this.axis==="Z"&&r&&(this.object.rotation.z=Math.round(this.object.rotation.z/r)*r)}this.object.updateMatrixWorld(),this.object.parent&&this.object.parent.updateMatrixWorld(),this.positionStart.copy(this.object.position),this.quaternionStart.copy(this.object.quaternion),this.scaleStart.copy(this.object.scale),this.object.matrixWorld.decompose(this.worldPositionStart,this.worldQuaternionStart,this.worldScaleStart),this.pointStart.copy(s.point).sub(this.worldPositionStart)}this.dragging=!0,this.mouseDownEvent.mode=this.mode,this.dispatchEvent(this.mouseDownEvent)}}),c(this,"pointerMove",n=>{const s=this.axis,l=this.mode,r=this.object;let f=this.space;if(l==="scale"?f="local":(s==="E"||s==="XYZE"||s==="XYZ")&&(f="world"),r===void 0||s===null||this.dragging===!1||n.button!==-1)return;this.raycaster.setFromCamera(n,this.camera);const p=this.intersectObjectWithRay(this.plane,this.raycaster,!0);if(p){if(this.pointEnd.copy(p.point).sub(this.worldPositionStart),l==="translate")this.offset.copy(this.pointEnd).sub(this.pointStart),f==="local"&&s!=="XYZ"&&this.offset.applyQuaternion(this.worldQuaternionInv),s.indexOf("X")===-1&&(this.offset.x=0),s.indexOf("Y")===-1&&(this.offset.y=0),s.indexOf("Z")===-1&&(this.offset.z=0),f==="local"&&s!=="XYZ"?this.offset.applyQuaternion(this.quaternionStart).divide(this.parentScale):this.offset.applyQuaternion(this.parentQuaternionInv).divide(this.parentScale),r.position.copy(this.offset).add(this.positionStart),this.translationSnap&&(f==="local"&&(r.position.applyQuaternion(this.tempQuaternion.copy(this.quaternionStart).invert()),s.search("X")!==-1&&(r.position.x=Math.round(r.position.x/this.translationSnap)*this.translationSnap),s.search("Y")!==-1&&(r.position.y=Math.round(r.position.y/this.translationSnap)*this.translationSnap),s.search("Z")!==-1&&(r.position.z=Math.round(r.position.z/this.translationSnap)*this.translationSnap),r.position.applyQuaternion(this.quaternionStart)),f==="world"&&(r.parent&&r.position.add(this.tempVector.setFromMatrixPosition(r.parent.matrixWorld)),s.search("X")!==-1&&(r.position.x=Math.round(r.position.x/this.translationSnap)*this.translationSnap),s.search("Y")!==-1&&(r.position.y=Math.round(r.position.y/this.translationSnap)*this.translationSnap),s.search("Z")!==-1&&(r.position.z=Math.round(r.position.z/this.translationSnap)*this.translationSnap),r.parent&&r.position.sub(this.tempVector.setFromMatrixPosition(r.parent.matrixWorld))));else if(l==="scale"){if(s.search("XYZ")!==-1){let w=this.pointEnd.length()/this.pointStart.length();this.pointEnd.dot(this.pointStart)<0&&(w*=-1),this.tempVector2.set(w,w,w)}else this.tempVector.copy(this.pointStart),this.tempVector2.copy(this.pointEnd),this.tempVector.applyQuaternion(this.worldQuaternionInv),this.tempVector2.applyQuaternion(this.worldQuaternionInv),this.tempVector2.divide(this.tempVector),s.search("X")===-1&&(this.tempVector2.x=1),s.search("Y")===-1&&(this.tempVector2.y=1),s.search("Z")===-1&&(this.tempVector2.z=1);r.scale.copy(this.scaleStart).multiply(this.tempVector2),this.scaleSnap&&this.object&&(s.search("X")!==-1&&(this.object.scale.x=Math.round(r.scale.x/this.scaleSnap)*this.scaleSnap||this.scaleSnap),s.search("Y")!==-1&&(r.scale.y=Math.round(r.scale.y/this.scaleSnap)*this.scaleSnap||this.scaleSnap),s.search("Z")!==-1&&(r.scale.z=Math.round(r.scale.z/this.scaleSnap)*this.scaleSnap||this.scaleSnap))}else if(l==="rotate"){this.offset.copy(this.pointEnd).sub(this.pointStart);const w=20/this.worldPosition.distanceTo(this.tempVector.setFromMatrixPosition(this.camera.matrixWorld));s==="E"?(this.rotationAxis.copy(this.eye),this.rotationAngle=this.pointEnd.angleTo(this.pointStart),this.startNorm.copy(this.pointStart).normalize(),this.endNorm.copy(this.pointEnd).normalize(),this.rotationAngle*=this.endNorm.cross(this.startNorm).dot(this.eye)<0?1:-1):s==="XYZE"?(this.rotationAxis.copy(this.offset).cross(this.eye).normalize(),this.rotationAngle=this.offset.dot(this.tempVector.copy(this.rotationAxis).cross(this.eye))*w):(s==="X"||s==="Y"||s==="Z")&&(this.rotationAxis.copy(this.unit[s]),this.tempVector.copy(this.unit[s]),f==="local"&&this.tempVector.applyQuaternion(this.worldQuaternion),this.rotationAngle=this.offset.dot(this.tempVector.cross(this.eye).normalize())*w),this.rotationSnap&&(this.rotationAngle=Math.round(this.rotationAngle/this.rotationSnap)*this.rotationSnap),f==="local"&&s!=="E"&&s!=="XYZE"?(r.quaternion.copy(this.quaternionStart),r.quaternion.multiply(this.tempQuaternion.setFromAxisAngle(this.rotationAxis,this.rotationAngle)).normalize()):(this.rotationAxis.applyQuaternion(this.parentQuaternionInv),r.quaternion.copy(this.tempQuaternion.setFromAxisAngle(this.rotationAxis,this.rotationAngle)),r.quaternion.multiply(this.quaternionStart).normalize())}this.dispatchEvent(this.changeEvent),this.dispatchEvent(this.objectChangeEvent)}}),c(this,"pointerUp",n=>{n.button===0&&(this.dragging&&this.axis!==null&&(this.mouseUpEvent.mode=this.mode,this.dispatchEvent(this.mouseUpEvent)),this.dragging=!1,this.axis=null)}),c(this,"getPointer",n=>{var s;if(this.domElement&&((s=this.domElement.ownerDocument)!=null&&s.pointerLockElement))return{x:0,y:0,button:n.button};{const l=n.changedTouches?n.changedTouches[0]:n,r=this.domElement.getBoundingClientRect();return{x:(l.clientX-r.left)/r.width*2-1,y:-(l.clientY-r.top)/r.height*2+1,button:n.button}}}),c(this,"onPointerHover",n=>{if(this.enabled)switch(n.pointerType){case"mouse":case"pen":this.pointerHover(this.getPointer(n));break}}),c(this,"onPointerDown",n=>{!this.enabled||!this.domElement||(this.domElement.style.touchAction="none",this.domElement.ownerDocument.addEventListener("pointermove",this.onPointerMove),this.pointerHover(this.getPointer(n)),this.pointerDown(this.getPointer(n)))}),c(this,"onPointerMove",n=>{this.enabled&&this.pointerMove(this.getPointer(n))}),c(this,"onPointerUp",n=>{!this.enabled||!this.domElement||(this.domElement.style.touchAction="",this.domElement.ownerDocument.removeEventListener("pointermove",this.onPointerMove),this.pointerUp(this.getPointer(n)))}),c(this,"getMode",()=>this.mode),c(this,"setMode",n=>{this.mode=n}),c(this,"setTranslationSnap",n=>{this.translationSnap=n}),c(this,"setRotationSnap",n=>{this.rotationSnap=n}),c(this,"setScaleSnap",n=>{this.scaleSnap=n}),c(this,"setSize",n=>{this.size=n}),c(this,"setSpace",n=>{this.space=n}),c(this,"update",()=>{console.warn("THREE.TransformControls: update function has no more functionality and therefore has been deprecated.")}),c(this,"connect",n=>{n===document&&console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'),this.domElement=n,this.domElement.addEventListener("pointerdown",this.onPointerDown),this.domElement.addEventListener("pointermove",this.onPointerHover),this.domElement.ownerDocument.addEventListener("pointerup",this.onPointerUp)}),c(this,"dispose",()=>{var n,s,l,r,f,p;(n=this.domElement)==null||n.removeEventListener("pointerdown",this.onPointerDown),(s=this.domElement)==null||s.removeEventListener("pointermove",this.onPointerHover),(r=(l=this.domElement)==null?void 0:l.ownerDocument)==null||r.removeEventListener("pointermove",this.onPointerMove),(p=(f=this.domElement)==null?void 0:f.ownerDocument)==null||p.removeEventListener("pointerup",this.onPointerUp),this.traverse(w=>{const y=w;y.geometry&&y.geometry.dispose(),y.material&&y.material.dispose()})}),this.domElement=i,this.camera=e,this.gizmo=new Bn,this.add(this.gizmo),this.plane=new Hn,this.add(this.plane);const o=(n,s)=>{let l=s;Object.defineProperty(this,n,{get:function(){return l!==void 0?l:s},set:function(r){l!==r&&(l=r,this.plane[n]=r,this.gizmo[n]=r,this.dispatchEvent({type:n+"-changed",value:r}),this.dispatchEvent(this.changeEvent))}}),this[n]=s,this.plane[n]=s,this.gizmo[n]=s};o("camera",this.camera),o("object",this.object),o("enabled",this.enabled),o("axis",this.axis),o("mode",this.mode),o("translationSnap",this.translationSnap),o("rotationSnap",this.rotationSnap),o("scaleSnap",this.scaleSnap),o("space",this.space),o("size",this.size),o("dragging",this.dragging),o("showX",this.showX),o("showY",this.showY),o("showZ",this.showZ),o("worldPosition",this.worldPosition),o("worldPositionStart",this.worldPositionStart),o("worldQuaternion",this.worldQuaternion),o("worldQuaternionStart",this.worldQuaternionStart),o("cameraPosition",this.cameraPosition),o("cameraQuaternion",this.cameraQuaternion),o("pointStart",this.pointStart),o("pointEnd",this.pointEnd),o("rotationAxis",this.rotationAxis),o("rotationAngle",this.rotationAngle),o("eye",this.eye),i!==void 0&&this.connect(i)}};class Bn extends Pt{constructor(){super(),c(this,"isTransformControlsGizmo",!0),c(this,"type","TransformControlsGizmo"),c(this,"tempVector",new v(0,0,0)),c(this,"tempEuler",new sn),c(this,"alignVector",new v(0,1,0)),c(this,"zeroVector",new v(0,0,0)),c(this,"lookAtMatrix",new re),c(this,"tempQuaternion",new K),c(this,"tempQuaternion2",new K),c(this,"identityQuaternion",new K),c(this,"unitX",new v(1,0,0)),c(this,"unitY",new v(0,1,0)),c(this,"unitZ",new v(0,0,1)),c(this,"gizmo"),c(this,"picker"),c(this,"helper"),c(this,"rotationAxis",new v),c(this,"cameraPosition",new v),c(this,"worldPositionStart",new v),c(this,"worldQuaternionStart",new K),c(this,"worldPosition",new v),c(this,"worldQuaternion",new K),c(this,"eye",new v),c(this,"camera",null),c(this,"enabled",!0),c(this,"axis",null),c(this,"mode","translate"),c(this,"space","world"),c(this,"size",1),c(this,"dragging",!1),c(this,"showX",!0),c(this,"showY",!0),c(this,"showZ",!0),c(this,"updateMatrixWorld",()=>{let Q=this.space;this.mode==="scale"&&(Q="local");const M=Q==="local"?this.worldQuaternion:this.identityQuaternion;this.gizmo.translate.visible=this.mode==="translate",this.gizmo.rotate.visible=this.mode==="rotate",this.gizmo.scale.visible=this.mode==="scale",this.helper.translate.visible=this.mode==="translate",this.helper.rotate.visible=this.mode==="rotate",this.helper.scale.visible=this.mode==="scale";let R=[];R=R.concat(this.picker[this.mode].children),R=R.concat(this.gizmo[this.mode].children),R=R.concat(this.helper[this.mode].children);for(let O=0;O<R.length;O++){const a=R[O];a.visible=!0,a.rotation.set(0,0,0),a.position.copy(this.worldPosition);let U;if(this.camera.isOrthographicCamera?U=(this.camera.top-this.camera.bottom)/this.camera.zoom:U=this.worldPosition.distanceTo(this.cameraPosition)*Math.min(1.9*Math.tan(Math.PI*this.camera.fov/360)/this.camera.zoom,7),a.scale.set(1,1,1).multiplyScalar(U*this.size/7),a.tag==="helper"){a.visible=!1,a.name==="AXIS"?(a.position.copy(this.worldPositionStart),a.visible=!!this.axis,this.axis==="X"&&(this.tempQuaternion.setFromEuler(this.tempEuler.set(0,0,0)),a.quaternion.copy(M).multiply(this.tempQuaternion),Math.abs(this.alignVector.copy(this.unitX).applyQuaternion(M).dot(this.eye))>.9&&(a.visible=!1)),this.axis==="Y"&&(this.tempQuaternion.setFromEuler(this.tempEuler.set(0,0,Math.PI/2)),a.quaternion.copy(M).multiply(this.tempQuaternion),Math.abs(this.alignVector.copy(this.unitY).applyQuaternion(M).dot(this.eye))>.9&&(a.visible=!1)),this.axis==="Z"&&(this.tempQuaternion.setFromEuler(this.tempEuler.set(0,Math.PI/2,0)),a.quaternion.copy(M).multiply(this.tempQuaternion),Math.abs(this.alignVector.copy(this.unitZ).applyQuaternion(M).dot(this.eye))>.9&&(a.visible=!1)),this.axis==="XYZE"&&(this.tempQuaternion.setFromEuler(this.tempEuler.set(0,Math.PI/2,0)),this.alignVector.copy(this.rotationAxis),a.quaternion.setFromRotationMatrix(this.lookAtMatrix.lookAt(this.zeroVector,this.alignVector,this.unitY)),a.quaternion.multiply(this.tempQuaternion),a.visible=this.dragging),this.axis==="E"&&(a.visible=!1)):a.name==="START"?(a.position.copy(this.worldPositionStart),a.visible=this.dragging):a.name==="END"?(a.position.copy(this.worldPosition),a.visible=this.dragging):a.name==="DELTA"?(a.position.copy(this.worldPositionStart),a.quaternion.copy(this.worldQuaternionStart),this.tempVector.set(1e-10,1e-10,1e-10).add(this.worldPositionStart).sub(this.worldPosition).multiplyScalar(-1),this.tempVector.applyQuaternion(this.worldQuaternionStart.clone().invert()),a.scale.copy(this.tempVector),a.visible=this.dragging):(a.quaternion.copy(M),this.dragging?a.position.copy(this.worldPositionStart):a.position.copy(this.worldPosition),this.axis&&(a.visible=this.axis.search(a.name)!==-1));continue}a.quaternion.copy(M),this.mode==="translate"||this.mode==="scale"?((a.name==="X"||a.name==="XYZX")&&Math.abs(this.alignVector.copy(this.unitX).applyQuaternion(M).dot(this.eye))>.99&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),(a.name==="Y"||a.name==="XYZY")&&Math.abs(this.alignVector.copy(this.unitY).applyQuaternion(M).dot(this.eye))>.99&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),(a.name==="Z"||a.name==="XYZZ")&&Math.abs(this.alignVector.copy(this.unitZ).applyQuaternion(M).dot(this.eye))>.99&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="XY"&&Math.abs(this.alignVector.copy(this.unitZ).applyQuaternion(M).dot(this.eye))<.2&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="YZ"&&Math.abs(this.alignVector.copy(this.unitX).applyQuaternion(M).dot(this.eye))<.2&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="XZ"&&Math.abs(this.alignVector.copy(this.unitY).applyQuaternion(M).dot(this.eye))<.2&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name.search("X")!==-1&&(this.alignVector.copy(this.unitX).applyQuaternion(M).dot(this.eye)<0?a.tag==="fwd"?a.visible=!1:a.scale.x*=-1:a.tag==="bwd"&&(a.visible=!1)),a.name.search("Y")!==-1&&(this.alignVector.copy(this.unitY).applyQuaternion(M).dot(this.eye)<0?a.tag==="fwd"?a.visible=!1:a.scale.y*=-1:a.tag==="bwd"&&(a.visible=!1)),a.name.search("Z")!==-1&&(this.alignVector.copy(this.unitZ).applyQuaternion(M).dot(this.eye)<0?a.tag==="fwd"?a.visible=!1:a.scale.z*=-1:a.tag==="bwd"&&(a.visible=!1))):this.mode==="rotate"&&(this.tempQuaternion2.copy(M),this.alignVector.copy(this.eye).applyQuaternion(this.tempQuaternion.copy(M).invert()),a.name.search("E")!==-1&&a.quaternion.setFromRotationMatrix(this.lookAtMatrix.lookAt(this.eye,this.zeroVector,this.unitY)),a.name==="X"&&(this.tempQuaternion.setFromAxisAngle(this.unitX,Math.atan2(-this.alignVector.y,this.alignVector.z)),this.tempQuaternion.multiplyQuaternions(this.tempQuaternion2,this.tempQuaternion),a.quaternion.copy(this.tempQuaternion)),a.name==="Y"&&(this.tempQuaternion.setFromAxisAngle(this.unitY,Math.atan2(this.alignVector.x,this.alignVector.z)),this.tempQuaternion.multiplyQuaternions(this.tempQuaternion2,this.tempQuaternion),a.quaternion.copy(this.tempQuaternion)),a.name==="Z"&&(this.tempQuaternion.setFromAxisAngle(this.unitZ,Math.atan2(this.alignVector.y,this.alignVector.x)),this.tempQuaternion.multiplyQuaternions(this.tempQuaternion2,this.tempQuaternion),a.quaternion.copy(this.tempQuaternion))),a.visible=a.visible&&(a.name.indexOf("X")===-1||this.showX),a.visible=a.visible&&(a.name.indexOf("Y")===-1||this.showY),a.visible=a.visible&&(a.name.indexOf("Z")===-1||this.showZ),a.visible=a.visible&&(a.name.indexOf("E")===-1||this.showX&&this.showY&&this.showZ),a.material.tempOpacity=a.material.tempOpacity||a.material.opacity,a.material.tempColor=a.material.tempColor||a.material.color.clone(),a.material.color.copy(a.material.tempColor),a.material.opacity=a.material.tempOpacity,this.enabled?this.axis&&(a.name===this.axis?(a.material.opacity=1,a.material.color.lerp(new Lt(1,1,1),.5)):this.axis.split("").some(function(tt){return a.name===tt})?(a.material.opacity=1,a.material.color.lerp(new Lt(1,1,1),.5)):(a.material.opacity*=.25,a.material.color.lerp(new Lt(1,1,1),.5))):(a.material.opacity*=.5,a.material.color.lerp(new Lt(1,1,1),.5))}super.updateMatrixWorld()});const e=new Le({depthTest:!1,depthWrite:!1,transparent:!0,side:se,fog:!1,toneMapped:!1}),i=new on({depthTest:!1,depthWrite:!1,transparent:!0,linewidth:1,fog:!1,toneMapped:!1}),o=e.clone();o.opacity=.15;const n=e.clone();n.opacity=.33;const s=e.clone();s.color.set(16711680);const l=e.clone();l.color.set(65280);const r=e.clone();r.color.set(255);const f=e.clone();f.opacity=.25;const p=f.clone();p.color.set(16776960);const w=f.clone();w.color.set(65535);const y=f.clone();y.color.set(16711935),e.clone().color.set(16776960);const u=i.clone();u.color.set(16711680);const S=i.clone();S.color.set(65280);const b=i.clone();b.color.set(255);const m=i.clone();m.color.set(65535);const g=i.clone();g.color.set(16711935);const z=i.clone();z.color.set(16776960);const x=i.clone();x.color.set(7895160);const L=z.clone();L.opacity=.25;const A=new ct(0,.05,.2,12,1,!1),_=new gt(.125,.125,.125),P=new Ht;P.setAttribute("position",new It([0,0,0,1,0,0],3));const X=(Q,M)=>{const R=new Ht,O=[];for(let a=0;a<=64*M;++a)O.push(0,Math.cos(a/32*Math.PI)*Q,Math.sin(a/32*Math.PI)*Q);return R.setAttribute("position",new It(O,3)),R},Y=()=>{const Q=new Ht;return Q.setAttribute("position",new It([0,0,0,1,1,1],3)),Q},rt={X:[[new j(A,s),[1,0,0],[0,0,-Math.PI/2],null,"fwd"],[new j(A,s),[1,0,0],[0,0,Math.PI/2],null,"bwd"],[new k(P,u)]],Y:[[new j(A,l),[0,1,0],null,null,"fwd"],[new j(A,l),[0,1,0],[Math.PI,0,0],null,"bwd"],[new k(P,S),null,[0,0,Math.PI/2]]],Z:[[new j(A,r),[0,0,1],[Math.PI/2,0,0],null,"fwd"],[new j(A,r),[0,0,1],[-Math.PI/2,0,0],null,"bwd"],[new k(P,b),null,[0,-Math.PI/2,0]]],XYZ:[[new j(new wt(.1,0),f.clone()),[0,0,0],[0,0,0]]],XY:[[new j(new yt(.295,.295),p.clone()),[.15,.15,0]],[new k(P,z),[.18,.3,0],null,[.125,1,1]],[new k(P,z),[.3,.18,0],[0,0,Math.PI/2],[.125,1,1]]],YZ:[[new j(new yt(.295,.295),w.clone()),[0,.15,.15],[0,Math.PI/2,0]],[new k(P,m),[0,.18,.3],[0,0,Math.PI/2],[.125,1,1]],[new k(P,m),[0,.3,.18],[0,-Math.PI/2,0],[.125,1,1]]],XZ:[[new j(new yt(.295,.295),y.clone()),[.15,0,.15],[-Math.PI/2,0,0]],[new k(P,g),[.18,0,.3],null,[.125,1,1]],[new k(P,g),[.3,0,.18],[0,-Math.PI/2,0],[.125,1,1]]]},H={X:[[new j(new ct(.2,0,1,4,1,!1),o),[.6,0,0],[0,0,-Math.PI/2]]],Y:[[new j(new ct(.2,0,1,4,1,!1),o),[0,.6,0]]],Z:[[new j(new ct(.2,0,1,4,1,!1),o),[0,0,.6],[Math.PI/2,0,0]]],XYZ:[[new j(new wt(.2,0),o)]],XY:[[new j(new yt(.4,.4),o),[.2,.2,0]]],YZ:[[new j(new yt(.4,.4),o),[0,.2,.2],[0,Math.PI/2,0]]],XZ:[[new j(new yt(.4,.4),o),[.2,0,.2],[-Math.PI/2,0,0]]]},J={START:[[new j(new wt(.01,2),n),null,null,null,"helper"]],END:[[new j(new wt(.01,2),n),null,null,null,"helper"]],DELTA:[[new k(Y(),n),null,null,null,"helper"]],X:[[new k(P,n.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]],Y:[[new k(P,n.clone()),[0,-1e3,0],[0,0,Math.PI/2],[1e6,1,1],"helper"]],Z:[[new k(P,n.clone()),[0,0,-1e3],[0,-Math.PI/2,0],[1e6,1,1],"helper"]]},V={X:[[new k(X(1,.5),u)],[new j(new wt(.04,0),s),[0,0,.99],null,[1,3,1]]],Y:[[new k(X(1,.5),S),null,[0,0,-Math.PI/2]],[new j(new wt(.04,0),l),[0,0,.99],null,[3,1,1]]],Z:[[new k(X(1,.5),b),null,[0,Math.PI/2,0]],[new j(new wt(.04,0),r),[.99,0,0],null,[1,3,1]]],E:[[new k(X(1.25,1),L),null,[0,Math.PI/2,0]],[new j(new ct(.03,0,.15,4,1,!1),L),[1.17,0,0],[0,0,-Math.PI/2],[1,1,.001]],[new j(new ct(.03,0,.15,4,1,!1),L),[-1.17,0,0],[0,0,Math.PI/2],[1,1,.001]],[new j(new ct(.03,0,.15,4,1,!1),L),[0,-1.17,0],[Math.PI,0,0],[1,1,.001]],[new j(new ct(.03,0,.15,4,1,!1),L),[0,1.17,0],[0,0,0],[1,1,.001]]],XYZE:[[new k(X(1,1),x),null,[0,Math.PI/2,0]]]},G={AXIS:[[new k(P,n.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]]},I={X:[[new j(new Rt(1,.1,4,24),o),[0,0,0],[0,-Math.PI/2,-Math.PI/2]]],Y:[[new j(new Rt(1,.1,4,24),o),[0,0,0],[Math.PI/2,0,0]]],Z:[[new j(new Rt(1,.1,4,24),o),[0,0,0],[0,0,-Math.PI/2]]],E:[[new j(new Rt(1.25,.1,2,24),o)]],XYZE:[[new j(new rn(.7,10,8),o)]]},it={X:[[new j(_,s),[.8,0,0],[0,0,-Math.PI/2]],[new k(P,u),null,null,[.8,1,1]]],Y:[[new j(_,l),[0,.8,0]],[new k(P,S),null,[0,0,Math.PI/2],[.8,1,1]]],Z:[[new j(_,r),[0,0,.8],[Math.PI/2,0,0]],[new k(P,b),null,[0,-Math.PI/2,0],[.8,1,1]]],XY:[[new j(_,p),[.85,.85,0],null,[2,2,.2]],[new k(P,z),[.855,.98,0],null,[.125,1,1]],[new k(P,z),[.98,.855,0],[0,0,Math.PI/2],[.125,1,1]]],YZ:[[new j(_,w),[0,.85,.85],null,[.2,2,2]],[new k(P,m),[0,.855,.98],[0,0,Math.PI/2],[.125,1,1]],[new k(P,m),[0,.98,.855],[0,-Math.PI/2,0],[.125,1,1]]],XZ:[[new j(_,y),[.85,0,.85],null,[2,.2,2]],[new k(P,g),[.855,0,.98],null,[.125,1,1]],[new k(P,g),[.98,0,.855],[0,-Math.PI/2,0],[.125,1,1]]],XYZX:[[new j(new gt(.125,.125,.125),f.clone()),[1.1,0,0]]],XYZY:[[new j(new gt(.125,.125,.125),f.clone()),[0,1.1,0]]],XYZZ:[[new j(new gt(.125,.125,.125),f.clone()),[0,0,1.1]]]},B={X:[[new j(new ct(.2,0,.8,4,1,!1),o),[.5,0,0],[0,0,-Math.PI/2]]],Y:[[new j(new ct(.2,0,.8,4,1,!1),o),[0,.5,0]]],Z:[[new j(new ct(.2,0,.8,4,1,!1),o),[0,0,.5],[Math.PI/2,0,0]]],XY:[[new j(_,o),[.85,.85,0],null,[3,3,.2]]],YZ:[[new j(_,o),[0,.85,.85],null,[.2,3,3]]],XZ:[[new j(_,o),[.85,0,.85],null,[3,.2,3]]],XYZX:[[new j(new gt(.2,.2,.2),o),[1.1,0,0]]],XYZY:[[new j(new gt(.2,.2,.2),o),[0,1.1,0]]],XYZZ:[[new j(new gt(.2,.2,.2),o),[0,0,1.1]]]},st={X:[[new k(P,n.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]],Y:[[new k(P,n.clone()),[0,-1e3,0],[0,0,Math.PI/2],[1e6,1,1],"helper"]],Z:[[new k(P,n.clone()),[0,0,-1e3],[0,-Math.PI/2,0],[1e6,1,1],"helper"]]},W=Q=>{const M=new Pt;for(let R in Q)for(let O=Q[R].length;O--;){const a=Q[R][O][0].clone(),U=Q[R][O][1],tt=Q[R][O][2],ot=Q[R][O][3],et=Q[R][O][4];a.name=R,a.tag=et,U&&a.position.set(U[0],U[1],U[2]),tt&&a.rotation.set(tt[0],tt[1],tt[2]),ot&&a.scale.set(ot[0],ot[1],ot[2]),a.updateMatrix();const ht=a.geometry.clone();ht.applyMatrix4(a.matrix),a.geometry=ht,a.renderOrder=1/0,a.position.set(0,0,0),a.rotation.set(0,0,0),a.scale.set(1,1,1),M.add(a)}return M};this.gizmo={},this.picker={},this.helper={},this.add(this.gizmo.translate=W(rt)),this.add(this.gizmo.rotate=W(V)),this.add(this.gizmo.scale=W(it)),this.add(this.picker.translate=W(H)),this.add(this.picker.rotate=W(I)),this.add(this.picker.scale=W(B)),this.add(this.helper.translate=W(J)),this.add(this.helper.rotate=W(G)),this.add(this.helper.scale=W(st)),this.picker.translate.visible=!1,this.picker.rotate.visible=!1,this.picker.scale.visible=!1}}class Hn extends j{constructor(){super(new yt(1e5,1e5,2,2),new Le({visible:!1,wireframe:!0,side:se,transparent:!0,opacity:.1,toneMapped:!1})),c(this,"isTransformControlsPlane",!0),c(this,"type","TransformControlsPlane"),c(this,"unitX",new v(1,0,0)),c(this,"unitY",new v(0,1,0)),c(this,"unitZ",new v(0,0,1)),c(this,"tempVector",new v),c(this,"dirVector",new v),c(this,"alignVector",new v),c(this,"tempMatrix",new re),c(this,"identityQuaternion",new K),c(this,"cameraQuaternion",new K),c(this,"worldPosition",new v),c(this,"worldQuaternion",new K),c(this,"eye",new v),c(this,"axis",null),c(this,"mode","translate"),c(this,"space","world"),c(this,"updateMatrixWorld",()=>{let e=this.space;switch(this.position.copy(this.worldPosition),this.mode==="scale"&&(e="local"),this.unitX.set(1,0,0).applyQuaternion(e==="local"?this.worldQuaternion:this.identityQuaternion),this.unitY.set(0,1,0).applyQuaternion(e==="local"?this.worldQuaternion:this.identityQuaternion),this.unitZ.set(0,0,1).applyQuaternion(e==="local"?this.worldQuaternion:this.identityQuaternion),this.alignVector.copy(this.unitY),this.mode){case"translate":case"scale":switch(this.axis){case"X":this.alignVector.copy(this.eye).cross(this.unitX),this.dirVector.copy(this.unitX).cross(this.alignVector);break;case"Y":this.alignVector.copy(this.eye).cross(this.unitY),this.dirVector.copy(this.unitY).cross(this.alignVector);break;case"Z":this.alignVector.copy(this.eye).cross(this.unitZ),this.dirVector.copy(this.unitZ).cross(this.alignVector);break;case"XY":this.dirVector.copy(this.unitZ);break;case"YZ":this.dirVector.copy(this.unitX);break;case"XZ":this.alignVector.copy(this.unitZ),this.dirVector.copy(this.unitY);break;case"XYZ":case"E":this.dirVector.set(0,0,0);break}break;default:this.dirVector.set(0,0,0)}this.dirVector.length()===0?this.quaternion.copy(this.cameraQuaternion):(this.tempMatrix.lookAt(this.tempVector.set(0,0,0),this.dirVector,this.alignVector),this.quaternion.setFromRotationMatrix(this.tempMatrix)),super.updateMatrixWorld()})}}const ge=new ae,Ot=new v;class ce extends ln{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],i=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],o=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(o),this.setAttribute("position",new It(e,3)),this.setAttribute("uv",new It(i,2))}applyMatrix4(e){const i=this.attributes.instanceStart,o=this.attributes.instanceEnd;return i!==void 0&&(i.applyMatrix4(e),o.applyMatrix4(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));const o=new Jt(i,6,1);return this.setAttribute("instanceStart",new bt(o,3,0)),this.setAttribute("instanceEnd",new bt(o,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,i=3){let o;e instanceof Float32Array?o=e:Array.isArray(e)&&(o=new Float32Array(e));const n=new Jt(o,i*2,1);return this.setAttribute("instanceColorStart",new bt(n,i,0)),this.setAttribute("instanceColorEnd",new bt(n,i,i)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new cn(e.geometry)),this}fromLineSegments(e){const i=e.geometry;return this.setPositions(i.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ae);const e=this.attributes.instanceStart,i=this.attributes.instanceEnd;e!==void 0&&i!==void 0&&(this.boundingBox.setFromBufferAttribute(e),ge.setFromBufferAttribute(i),this.boundingBox.union(ge))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ie),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,i=this.attributes.instanceEnd;if(e!==void 0&&i!==void 0){const o=this.boundingSphere.center;this.boundingBox.getCenter(o);let n=0;for(let s=0,l=e.count;s<l;s++)Ot.fromBufferAttribute(e,s),n=Math.max(n,o.distanceToSquared(Ot)),Ot.fromBufferAttribute(i,s),n=Math.max(n,o.distanceToSquared(Ot));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}class De extends ce{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const i=e.length-3,o=new Float32Array(2*i);for(let n=0;n<i;n+=3)o[2*n]=e[n],o[2*n+1]=e[n+1],o[2*n+2]=e[n+2],o[2*n+3]=e[n+3],o[2*n+4]=e[n+4],o[2*n+5]=e[n+5];return super.setPositions(o),this}setColors(e,i=3){const o=e.length-i,n=new Float32Array(2*o);if(i===3)for(let s=0;s<o;s+=i)n[2*s]=e[s],n[2*s+1]=e[s+1],n[2*s+2]=e[s+2],n[2*s+3]=e[s+3],n[2*s+4]=e[s+4],n[2*s+5]=e[s+5];else for(let s=0;s<o;s+=i)n[2*s]=e[s],n[2*s+1]=e[s+1],n[2*s+2]=e[s+2],n[2*s+3]=e[s+3],n[2*s+4]=e[s+4],n[2*s+5]=e[s+5],n[2*s+6]=e[s+6],n[2*s+7]=e[s+7];return super.setColors(n,i),this}fromLine(e){const i=e.geometry;return this.setPositions(i.attributes.position.array),this}}class he extends hn{constructor(e){super({type:"LineMaterial",uniforms:ue.clone(ue.merge([pe.common,pe.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new oe(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${_e>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(i){this.uniforms.diffuse.value=i}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(i){i===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(i){this.uniforms.linewidth.value=i}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(i){!!i!="USE_DASH"in this.defines&&(this.needsUpdate=!0),i===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(i){this.uniforms.dashScale.value=i}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(i){this.uniforms.dashSize.value=i}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(i){this.uniforms.dashOffset.value=i}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(i){this.uniforms.gapSize.value=i}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(i){this.uniforms.opacity.value=i}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(i){this.uniforms.resolution.value.copy(i)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(i){!!i!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),i===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}const Wt=new jt,we=new v,ye=new v,N=new jt,q=new jt,dt=new jt,Ft=new v,Gt=new re,$=new dn,xe=new v,kt=new ae,Tt=new Ie,ut=new jt;let pt,vt;function ve(t,e,i){return ut.set(0,0,-e,1).applyMatrix4(t.projectionMatrix),ut.multiplyScalar(1/ut.w),ut.x=vt/i.width,ut.y=vt/i.height,ut.applyMatrix4(t.projectionMatrixInverse),ut.multiplyScalar(1/ut.w),Math.abs(Math.max(ut.x,ut.y))}function Wn(t,e){const i=t.matrixWorld,o=t.geometry,n=o.attributes.instanceStart,s=o.attributes.instanceEnd,l=Math.min(o.instanceCount,n.count);for(let r=0,f=l;r<f;r++){$.start.fromBufferAttribute(n,r),$.end.fromBufferAttribute(s,r),$.applyMatrix4(i);const p=new v,w=new v;pt.distanceSqToSegment($.start,$.end,w,p),w.distanceTo(p)<vt*.5&&e.push({point:w,pointOnLine:p,distance:pt.origin.distanceTo(w),object:t,face:null,faceIndex:r,uv:null,[Ce]:null})}}function Fn(t,e,i){const o=e.projectionMatrix,s=t.material.resolution,l=t.matrixWorld,r=t.geometry,f=r.attributes.instanceStart,p=r.attributes.instanceEnd,w=Math.min(r.instanceCount,f.count),y=-e.near;pt.at(1,dt),dt.w=1,dt.applyMatrix4(e.matrixWorldInverse),dt.applyMatrix4(o),dt.multiplyScalar(1/dt.w),dt.x*=s.x/2,dt.y*=s.y/2,dt.z=0,Ft.copy(dt),Gt.multiplyMatrices(e.matrixWorldInverse,l);for(let E=0,u=w;E<u;E++){if(N.fromBufferAttribute(f,E),q.fromBufferAttribute(p,E),N.w=1,q.w=1,N.applyMatrix4(Gt),q.applyMatrix4(Gt),N.z>y&&q.z>y)continue;if(N.z>y){const x=N.z-q.z,L=(N.z-y)/x;N.lerp(q,L)}else if(q.z>y){const x=q.z-N.z,L=(q.z-y)/x;q.lerp(N,L)}N.applyMatrix4(o),q.applyMatrix4(o),N.multiplyScalar(1/N.w),q.multiplyScalar(1/q.w),N.x*=s.x/2,N.y*=s.y/2,q.x*=s.x/2,q.y*=s.y/2,$.start.copy(N),$.start.z=0,$.end.copy(q),$.end.z=0;const b=$.closestPointToPointParameter(Ft,!0);$.at(b,xe);const m=un.lerp(N.z,q.z,b),g=m>=-1&&m<=1,z=Ft.distanceTo(xe)<vt*.5;if(g&&z){$.start.fromBufferAttribute(f,E),$.end.fromBufferAttribute(p,E),$.start.applyMatrix4(l),$.end.applyMatrix4(l);const x=new v,L=new v;pt.distanceSqToSegment($.start,$.end,L,x),i.push({point:L,pointOnLine:x,distance:pt.origin.distanceTo(L),object:t,face:null,faceIndex:E,uv:null,[Ce]:null})}}}class Re extends j{constructor(e=new ce,i=new he({color:Math.random()*16777215})){super(e,i),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,i=e.attributes.instanceStart,o=e.attributes.instanceEnd,n=new Float32Array(2*i.count);for(let l=0,r=0,f=i.count;l<f;l++,r+=2)we.fromBufferAttribute(i,l),ye.fromBufferAttribute(o,l),n[r]=r===0?0:n[r-1],n[r+1]=n[r]+we.distanceTo(ye);const s=new Jt(n,2,1);return e.setAttribute("instanceDistanceStart",new bt(s,1,0)),e.setAttribute("instanceDistanceEnd",new bt(s,1,1)),this}raycast(e,i){const o=this.material.worldUnits,n=e.camera;n===null&&!o&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const s=e.params.Line2!==void 0&&e.params.Line2.threshold||0;pt=e.ray;const l=this.matrixWorld,r=this.geometry,f=this.material;vt=f.linewidth+s,r.boundingSphere===null&&r.computeBoundingSphere(),Tt.copy(r.boundingSphere).applyMatrix4(l);let p;if(o)p=vt*.5;else{const y=Math.max(n.near,Tt.distanceToPoint(pt.origin));p=ve(n,y,f.resolution)}if(Tt.radius+=p,pt.intersectsSphere(Tt)===!1)return;r.boundingBox===null&&r.computeBoundingBox(),kt.copy(r.boundingBox).applyMatrix4(l);let w;if(o)w=vt*.5;else{const y=Math.max(n.near,kt.distanceToPoint(pt.origin));w=ve(n,y,f.resolution)}kt.expandByScalar(w),pt.intersectsBox(kt)!==!1&&(o?Wn(this,i):Fn(this,n,i))}onBeforeRender(e){const i=this.material.uniforms;i&&i.resolution&&(e.getViewport(Wt),this.material.uniforms.resolution.value.set(Wt.z,Wt.w))}}class Gn extends Re{constructor(e=new De,i=new he({color:Math.random()*16777215})){super(e,i),this.isLine2=!0,this.type="Line2"}}const Nn=d.forwardRef(function({points:e,color:i=16777215,vertexColors:o,linewidth:n,lineWidth:s,segments:l,dashed:r,...f},p){var w,y;const E=T(g=>g.size),u=d.useMemo(()=>l?new Re:new Gn,[l]),[S]=d.useState(()=>new he),b=(o==null||(w=o[0])==null?void 0:w.length)===4?4:3,m=d.useMemo(()=>{const g=l?new ce:new De,z=e.map(x=>{const L=Array.isArray(x);return x instanceof v||x instanceof jt?[x.x,x.y,x.z]:x instanceof oe?[x.x,x.y,0]:L&&x.length===3?[x[0],x[1],x[2]]:L&&x.length===2?[x[0],x[1],0]:x});if(g.setPositions(z.flat()),o){i=16777215;const x=o.map(L=>L instanceof Lt?L.toArray():L);g.setColors(x.flat(),b)}return g},[e,l,o,b]);return d.useLayoutEffect(()=>{u.computeLineDistances()},[e,u]),d.useLayoutEffect(()=>{r?S.defines.USE_DASH="":delete S.defines.USE_DASH,S.needsUpdate=!0},[r,S]),d.useEffect(()=>()=>{m.dispose(),S.dispose()},[m]),d.createElement("primitive",Et({object:u,ref:p},f),d.createElement("primitive",{object:m,attach:"geometry"}),d.createElement("primitive",Et({object:S,attach:"material",color:i,vertexColors:!!o,resolution:[E.width,E.height],linewidth:(y=n??s)!==null&&y!==void 0?y:1,dashed:r,transparent:b===4},f)))}),qn=d.forwardRef(({threshold:t=15,geometry:e,...i},o)=>{const n=d.useRef(null);d.useImperativeHandle(o,()=>n.current,[]);const s=d.useMemo(()=>[0,0,0,1,0,0],[]),l=d.useRef(null),r=d.useRef(null);return d.useLayoutEffect(()=>{const f=n.current.parent,p=e??f?.geometry;if(!p||l.current===p&&r.current===t)return;l.current=p,r.current=t;const y=new pn(p,t).attributes.position.array;n.current.geometry.setPositions(y),n.current.geometry.attributes.instanceStart.needsUpdate=!0,n.current.geometry.attributes.instanceEnd.needsUpdate=!0,n.current.computeLineDistances()}),d.createElement(Nn,Et({segments:!0,points:s,ref:n,raycast:()=>null},i))});function $n(t,e,i){const o=T(u=>u.size),n=T(u=>u.viewport),s=typeof t=="number"?t:o.width*n.dpr,l=o.height*n.dpr,r=(typeof t=="number"?i:t)||{},{samples:f=0,depth:p,...w}=r,y=p??r.depthBuffer,E=d.useMemo(()=>{const u=new fn(s,l,{minFilter:fe,magFilter:fe,type:mn,...w});return y&&(u.depthTexture=new gn(s,l,wn)),u.samples=f,u},[]);return d.useLayoutEffect(()=>{E.setSize(s,l),f&&(E.samples=f)},[f,E,s,l]),d.useEffect(()=>()=>E.dispose(),[]),E}const Jn=t=>typeof t=="function",Kn=d.forwardRef(({envMap:t,resolution:e=256,frames:i=1/0,children:o,makeDefault:n,...s},l)=>{const r=T(({set:m})=>m),f=T(({camera:m})=>m),p=T(({size:m})=>m),w=d.useRef(null);d.useImperativeHandle(l,()=>w.current,[]);const y=d.useRef(null),E=$n(e);d.useLayoutEffect(()=>{s.manual||w.current.updateProjectionMatrix()},[p,s]),d.useLayoutEffect(()=>{w.current.updateProjectionMatrix()}),d.useLayoutEffect(()=>{if(n){const m=f;return r(()=>({camera:w.current})),()=>r(()=>({camera:m}))}},[w,n,r]);let u=0,S=null;const b=Jn(o);return At(m=>{b&&(i===1/0||u<i)&&(y.current.visible=!1,m.gl.setRenderTarget(E),S=m.scene.background,t&&(m.scene.background=t),m.gl.render(m.scene,w.current),m.scene.background=S,m.gl.setRenderTarget(null),y.current.visible=!0,u++)}),d.createElement(d.Fragment,null,d.createElement("orthographicCamera",Et({left:p.width/-2,right:p.width/2,top:p.height/2,bottom:p.height/-2,ref:w},s),!b&&o),d.createElement("group",{ref:y},b&&o(E.texture)))}),ti=d.forwardRef(({children:t,domElement:e,onChange:i,onMouseDown:o,onMouseUp:n,onObjectChange:s,object:l,makeDefault:r,camera:f,enabled:p,axis:w,mode:y,translationSnap:E,rotationSnap:u,scaleSnap:S,space:b,size:m,showX:g,showY:z,showZ:x,...L},A)=>{const _=T(M=>M.controls),P=T(M=>M.gl),X=T(M=>M.events),Y=T(M=>M.camera),rt=T(M=>M.invalidate),H=T(M=>M.get),J=T(M=>M.set),V=f||Y,G=e||X.connected||P.domElement,I=d.useMemo(()=>new Un(V,G),[V,G]),it=d.useRef(null);d.useLayoutEffect(()=>(l?I.attach(l instanceof Pt?l:l.current):it.current instanceof Pt&&I.attach(it.current),()=>{I.detach()}),[l,t,I]),d.useEffect(()=>{if(_){const M=R=>_.enabled=!R.value;return I.addEventListener("dragging-changed",M),()=>I.removeEventListener("dragging-changed",M)}},[I,_]);const B=d.useRef(void 0),st=d.useRef(void 0),W=d.useRef(void 0),Q=d.useRef(void 0);return d.useLayoutEffect(()=>{B.current=i},[i]),d.useLayoutEffect(()=>{st.current=o},[o]),d.useLayoutEffect(()=>{W.current=n},[n]),d.useLayoutEffect(()=>{Q.current=s},[s]),d.useEffect(()=>{const M=U=>{rt(),B.current==null||B.current(U)},R=U=>st.current==null?void 0:st.current(U),O=U=>W.current==null?void 0:W.current(U),a=U=>Q.current==null?void 0:Q.current(U);return I.addEventListener("change",M),I.addEventListener("mouseDown",R),I.addEventListener("mouseUp",O),I.addEventListener("objectChange",a),()=>{I.removeEventListener("change",M),I.removeEventListener("mouseDown",R),I.removeEventListener("mouseUp",O),I.removeEventListener("objectChange",a)}},[rt,I]),d.useEffect(()=>{if(r){const M=H().controls;return J({controls:I}),()=>J({controls:M})}},[r,I]),d.createElement(d.Fragment,null,d.createElement("primitive",{ref:A,object:I,enabled:p,axis:w,mode:y,translationSnap:E,rotationSnap:u,scaleSnap:S,space:b,size:m,showX:g,showY:z,showZ:x}),d.createElement("group",Et({ref:it},L),t))});function ei({pixelated:t}){const e=T(l=>l.gl),i=T(l=>l.internal.active),o=T(l=>l.performance.current),n=T(l=>l.viewport.initialDpr),s=T(l=>l.setDpr);return d.useEffect(()=>{const l=e.domElement;return()=>{i&&s(n),t&&l&&(l.style.imageRendering="auto")}},[]),d.useEffect(()=>{s(o*n),t&&e.domElement&&(e.domElement.style.imageRendering=o===1?"auto":"pixelated")},[o]),null}function ni({slot:t}){const e=T(i=>i.get);return d.useLayoutEffect(()=>{async function i(){const{gl:o,scene:n,camera:s}=e();if(!o.domElement.width||!o.domElement.height||o.getContext().isContextLost())throw new Error("Abra uma vista 3D funcional antes de exportar a imagem.");return o.render(n,s),Ue(o.domElement)}return t.current=i,()=>{t.current===i&&(t.current=null)}},[e,t]),null}function ii({x:t,y:e,z:i,pivot:o,roomId:n,ids:s,snap:l,onPreview:r,onCommit:f}){const p=d.useRef(null),w=d.useRef(null),y=T(m=>m.controls),E=T(m=>m.gl.domElement),u=T(m=>m.invalidate);At(({camera:m,size:g})=>{if(!p.current)return;let z=1;m instanceof Mt?z=(m.top-m.bottom)/m.zoom:m instanceof Vt&&(z=2*Math.hypot(m.position.x-t,m.position.y-e,m.position.z-i)*Math.tan(m.fov*Math.PI/360)/m.zoom),p.current.scale.setScalar(72*z/Math.max(1,g.height))});function S(m){if(Math.abs(m.ray.direction.y)<.035)return null;const g=m.ray.intersectPlane(new yn(new v(0,1,0),-e),new v);return g?Math.atan2(g.z-i,g.x-t):null}function b(m,g){const z=S(m),x=z===null||g.angle===null?(m.clientX-g.clientX)*-.014:g.angle-z,L=Math.atan2(Math.sin(x),Math.cos(x));return{roomId:n,ids:s,pivot:o,angle:l?Math.round(L/(Math.PI/12))*Math.PI/12:L}}return d.useEffect(()=>{function m(){const x=w.current;x&&(w.current=null,x.target.releasePointerCapture(x.pointerId),y&&(y.enabled=!0),r(null),u())}function g(x){x.key==="Escape"&&m()}const z=E.ownerDocument.defaultView;return z?.addEventListener("keydown",g),z?.addEventListener("blur",m),E.parentElement?.addEventListener("pointercancel",m),()=>{z?.removeEventListener("keydown",g),z?.removeEventListener("blur",m),E.parentElement?.removeEventListener("pointercancel",m),m()}},[E,u,r,y]),h.jsxs("group",{ref:p,position:[t,e,i],rotation:[-Math.PI/2,0,0],children:[h.jsxs("mesh",{onPointerDown:m=>{if(m.button!==0||w.current)return;m.stopPropagation();const g=m.target;g.setPointerCapture(m.pointerId),w.current={pointerId:m.pointerId,angle:S(m),clientX:m.clientX,target:g},y&&(y.enabled=!1)},onPointerMove:m=>{w.current?.pointerId===m.pointerId&&(m.stopPropagation(),r(b(m,w.current)))},onPointerUp:m=>{const g=w.current;!g||g.pointerId!==m.pointerId||(m.stopPropagation(),w.current=null,g.target.releasePointerCapture(m.pointerId),y&&(y.enabled=!0),f(b(m,g)))},children:[h.jsx("torusGeometry",{args:[1,.105,10,64]}),h.jsx("meshBasicMaterial",{transparent:!0,opacity:0,depthWrite:!1})]}),h.jsxs("mesh",{renderOrder:3,raycast:()=>{},children:[h.jsx("torusGeometry",{args:[1,.028,8,64]}),h.jsx("meshBasicMaterial",{color:"#18734c",depthTest:!1,depthWrite:!1})]})]})}function si({room:t,objects:e,center:i,mode:o,snap:n,onPreview:s,onCommit:l}){const r={x:e.reduce((u,S)=>u+S.position.x,0)/e.length,z:e.reduce((u,S)=>u+S.position.z,0)/e.length},f=e.map(Be),p=f.reduce((u,S)=>u+S.center.y,0)/e.length,w=r.x+t.origin.x-i.x,y=r.z+t.origin.z-i.z,E=e.map(u=>u.id);return o==="rotate"?h.jsx(ii,{x:w,y:p,z:y,pivot:r,roomId:t.id,ids:E,snap:n,onPreview:s,onCommit:l}):h.jsx(oi,{x:w,y:p,z:y,roomId:t.id,ids:E,bottom:Math.min(...f.map(u=>u.bottom)),snap:n,onPreview:s,onCommit:l})}function oi({x:t,y:e,z:i,roomId:o,ids:n,bottom:s,snap:l,onPreview:r,onCommit:f}){const[p,w]=d.useState(0),y=d.useRef(null),E=d.useCallback(x=>{y.current&&y.current!==x&&y.current.dispose(),y.current=x},[]),u=d.useMemo(()=>new Pt,[]),S=T(x=>x.gl),b=T(x=>x.invalidate),m=T(x=>x.controls),g=d.useRef(null);d.useLayoutEffect(()=>{g.current||(u.position.set(t,e,i),u.rotation.set(0,0,0,"YXZ"),u.updateMatrixWorld(),b())},[t,e,i,u,b]),d.useEffect(()=>{function x(){const X=g.current;return X?(g.current=null,u.position.set(X.x,X.y,X.z),u.rotation.set(0,0,0),u.updateMatrixWorld(),m&&(m.enabled=!0),r(null),b(),!0):!1}function L(){x()&&w(X=>X+1)}function A(X){X.key==="Escape"&&L()}const _=S.domElement,P=_.ownerDocument.defaultView;return P?.addEventListener("blur",L),P?.addEventListener("keydown",A),_.parentElement?.addEventListener("pointercancel",L),()=>{P?.removeEventListener("blur",L),P?.removeEventListener("keydown",A),_.parentElement?.removeEventListener("pointercancel",L),x()}},[S,m,r,u,b]);function z(){const x=g.current;if(!x)return null;const L={roomId:o,ids:x.ids},A={x:u.position.x-x.x,y:u.position.y-x.y,z:u.position.z-x.z};if(l){for(const P of["x","y","z"])A[P]=Math.round(A[P]/l)*l;const _=x.bottom+u.position.y-x.y;Math.abs(_)<l/2&&(A.y=-x.bottom)}return{...L,delta:A}}return h.jsxs(h.Fragment,{children:[h.jsx("primitive",{object:u}),h.jsx(ti,{ref:E,object:u,mode:"translate",size:.85,onMouseDown:()=>{g.current={x:u.position.x,y:u.position.y,z:u.position.z,ids:n,bottom:s}},onObjectChange:()=>{const x=z();x&&r(x)},onMouseUp:()=>{const x=z();g.current=null,x&&(f(x),u.position.set(t+x.delta.x,e+x.delta.y,i+x.delta.z),u.updateMatrixWorld(),b())}},p)]})}const be=(t,e)=>t.x*e.z-t.z*e.x;function ri(t,e,i){const o=e.start,n=zt(Yt(t.end,t.start),1/St(t.start,t.end)),s=zt(Yt(e.end,e.start),1/St(e.start,e.end)),l=be(n,s);if(l*i<=1e-8)return;const r=Ut(o,zt({x:n.z,z:-n.x},t.thickness*i)),f=Ut(o,zt({x:s.z,z:-s.x},e.thickness*i)),p=Ut(r,zt(n,be(Yt(f,r),s)/l));return St(p,o)<=4*Math.max(t.thickness,e.thickness)?[o,r,p,f]:[o,r,f]}const Nt=new Map;function ai(t,e){let i=Nt.get(t);if(!i){const n=new AbortController,{signal:s}=n,l=(async()=>{const r=await He.read(e.files),f=await zn({entry:e.entry,format:e.format,files:r},s),p=await xn(f,s);try{return s.throwIfAborted(),{...vn(p.scene,e),release:p.release}}catch(w){throw p.release(),w}})();i={users:0,cancel:n,task:l},Nt.set(t,i)}const o=i;return o.users++,{task:o.task,release(){o.users--,queueMicrotask(()=>{o.users||(Nt.delete(t),o.cancel.abort(),o.task.then(n=>n.release(),()=>{}))})}}}function li(t){const e=t?JSON.stringify(t):"",[i,o]=d.useState();return d.useEffect(()=>{if(!e)return;let n=!0;const s=ai(e,JSON.parse(e));return s.task.then(l=>{n&&o({key:e,resource:l})},l=>{n&&o({key:e,error:l instanceof Error?l.message:"Não foi possível ler o modelo."})}),()=>{n=!1,s.release()}},[e]),i?.key===e?i:void 0}function ci({asset:t,selected:e}){const i=li(t.model),o=i?.resource?.scene,n=d.useMemo(()=>o?bn(o):void 0,[o]);if(d.useEffect(()=>()=>{n&&Sn(n)},[n]),n){const{width:l,height:r,depth:f}=t.nativeDimensions;return h.jsx("group",{scale:[1/l,1/r,1/f],children:h.jsx("primitive",{object:n,dispose:null})})}const s=i?.error??(t.model?void 0:"Faltam os ficheiros locais deste modelo. Volte a importá-lo.");return h.jsxs(h.Fragment,{children:[h.jsxs("mesh",{position:[0,.5,0],children:[h.jsx("boxGeometry",{args:[1,1,1]}),h.jsx("meshBasicMaterial",{wireframe:!0,color:s?"#a64b50":"#6882b0",transparent:!0,opacity:.7})]}),(e||s)&&h.jsx(Vn,{position:[0,.65,0],center:!0,pointerEvents:"none",children:h.jsx("span",{className:`model-marker${s?" error":""}`,role:"status",children:s??"A carregar modelo…"})})]})}const Qt="#c49c71",xt="#586575",Se="#e5e0d4",hi="#364d61",te="#2c3036",D=(t,e,i,o)=>({position:t,size:e,color:i,roughness:o}),Me=(t,e)=>({position:t,size:e,color:te,wheel:!0}),Ee=(t,e)=>[D([0,1-t/2,0],[1,t,1],e),...[-.41,.41].flatMap(i=>[-.39,.39].map(o=>D([i,(1-t)/2,o],[.1,1-t,.12],xt)))],di={box:[D([0,.5,0],[1,1,1])],shelf:[...[-.46,.46].map(t=>D([t,.5,0],[.08,1,1])),...[.035,.27,.5,.74,.965].map(t=>D([0,t,0],[.84,.07,1],Qt))],cabinet:[D([0,.5,-.02],[1,1,.96]),...[-.25,.25].map(t=>D([t,.52,.48],[.485,.92,.04])),...[-.06,.06].map(t=>D([t,.52,.49],[.025,.1,.02],xt))],table:Ee(.11),bench:[...Ee(.17,Qt),D([0,.26,0],[.8,.07,.73])],sofa:[D([0,.16,0],[1,.32,1]),D([0,.64,-.41],[1,.72,.18]),...[-.44,.44].map(t=>D([t,.43,.06],[.12,.5,.88])),...[-.19,.19].map(t=>D([t,.35,.08],[.37,.16,.79]))],bed:[D([0,.2,0],[1,.4,1],Qt),D([0,.5,-.46],[1,1,.08],Qt),D([0,.49,.04],[.98,.18,.92],Se),D([0,.61,.19],[.98,.06,.62]),...[-.24,.24].map(t=>D([t,.62,-.26],[.39,.09,.25],Se))],ledge:[D([0,.78,0],[1,.44,1]),...[-.37,.37].map(t=>D([t,.28,-.24],[.055,.56,.48],xt))],appliance:[D([0,.5,-.015],[1,1,.97],void 0,.38),D([0,.68,.487],[.94,.61,.025],void 0,.42),D([0,.193,.487],[.94,.348,.025],void 0,.42),D([-.29,.51,.49],[.33,.036,.02],xt),D([-.29,.34,.49],[.33,.036,.02],xt)],car:[D([0,.39,0],[.94,.36,1]),D([0,.63,-.32],[.9,.14,.32]),D([0,.75,.035],[.79,.37,.45],hi,.35),D([0,.963,.035],[.76,.074,.39]),...[-.41,.41].flatMap(t=>[-.32,.32].map(e=>Me([t,.21,e],[.18,.42,.145]))),...[-.33,.33].flatMap(t=>[D([t,.49,-.497],[.19,.08,.006],"#f3e7c7"),D([t,.48,.497],[.17,.08,.006],"#a23f43")])],motorcycle:[...[-.34,.34].map(t=>Me([0,.225,t],[.22,.45,.32])),D([0,.39,.03],[.45,.34,.45],xt),D([0,.63,-.065],[.58,.25,.31]),D([0,.68,.24],[.42,.12,.36],te),...[-.15,.15].map(t=>D([t,.49,-.31],[.075,.58,.07],xt)),D([0,.84,-.32],[.34,.14,.1],"#f3e7c7"),D([0,.96,-.31],[1,.08,.06],te),D([0,.68,.43],[.3,.08,.08])]};function ui({object:t,asset:e,selected:i,onSelect:o}){const{position:n,rotation:s,dimensions:l,scale:r,anchor:f}=t,{shape:p,color:w}=We(e,t),y=typeof r=="number"?[r,r,r]:[r.x,r.y,r.z],E=Fe(f);return h.jsx("group",{position:[n.x,n.y,n.z],rotation:[s.x,s.y,s.z,"YXZ"],scale:y,onClick:u=>{u.delta>5||(u.stopPropagation(),o(u.shiftKey||u.metaKey))},children:h.jsx("group",{scale:[l.width,l.height,l.depth],children:h.jsxs("group",{position:[E.x,E.y,E.z],children:[e?.kind==="glb"?h.jsx(ci,{asset:e,selected:i}):di[p].map(({position:u,size:S,color:b,roughness:m,wheel:g},z)=>h.jsxs("mesh",{position:u,rotation:g?[0,0,Math.PI/2]:void 0,scale:g?[S[1],S[0],S[2]]:void 0,castShadow:!0,receiveShadow:!0,children:[g?h.jsx("cylinderGeometry",{args:[.5,.5,1,16]}):h.jsx("boxGeometry",{args:S}),h.jsx("meshStandardMaterial",{color:b??w,roughness:m??.76,metalness:0})]},z)),i&&h.jsxs("mesh",{position:[0,.5,0],raycast:()=>{},children:[h.jsx("boxGeometry",{args:[1.015,1.015,1.015]}),h.jsx("meshBasicMaterial",{visible:!1}),h.jsx(qn,{color:"#2a51d2",raycast:()=>{}})]})]})})})}function Oe(t){const e=new Mn;for(const[i,o]of t.entries())i?e.lineTo(o.x,-o.z):e.moveTo(o.x,-o.z);return e.closePath(),e}function Pe({points:t,altitude:e,depth:i,material:o,onSelect:n}){const s=d.useMemo(()=>Oe(t),[t]),l=d.useMemo(()=>({depth:i,bevelEnabled:!1}),[i]);return h.jsxs("mesh",{position:[0,e,0],rotation:[-Math.PI/2,0,0],castShadow:!0,receiveShadow:!0,onClick:r=>{r.delta>5||(r.stopPropagation(),n())},children:[h.jsx("extrudeGeometry",{args:[s,l]}),h.jsx("meshStandardMaterial",{...o})]})}function ee(t,e,i,o,n){const s=St(t.start,t.end);return e*((t.end.z-t.start.z)*(i.x-o-t.start.x)-(t.end.x-t.start.x)*(i.z-n-t.start.z))/s}function pi({wall:t,room:e,winding:i,mode:o,worldX:n,worldZ:s,selected:l,onSelect:r}){const f=d.useRef(null),p=T(g=>g.invalidate);d.useLayoutEffect(()=>{p()},[p,o,l]);const w=St(t.start,t.end),y=(t.end.x-t.start.x)/w,E=(t.end.z-t.start.z)/w,u=d.useMemo(()=>e.openings.filter(g=>g.wallId===t.id),[e.openings,t.id]),S=d.useMemo(()=>$t(t,u),[t,u]),b=Xt(ie,t.materialId,"paint-white");At(({camera:g})=>{if(!f.current)return;const z=ee(t,i,g.position,n,s);f.current.visible=o==="all"||o==="cut"&&(l||z<.05)});const m=-i*t.thickness/2;return h.jsxs("group",{ref:f,position:[t.start.x,0,t.start.z],rotation:[0,-Math.atan2(E,y),0],children:[S.map(({start:g,end:z,bottom:x,top:L})=>h.jsxs("mesh",{position:[(g+z)/2,(x+L)/2,m],castShadow:!0,receiveShadow:!0,onClick:A=>{!f.current?.visible||A.delta>5||(A.stopPropagation(),r())},children:[h.jsx("boxGeometry",{args:[z-g,L-x,t.thickness]}),h.jsx("meshStandardMaterial",{...b,color:l?"#8ca7e6":b.color})]},`${g}-${x}`)),u.map(g=>{const z=Math.min(.035,g.width/6,g.height/6);if(g.kind==="void")return null;const x=g.kind==="window"?"#587889":"#a07a54",L=[{x:g.offset-z/2,y:g.sillHeight+g.height/2,w:z,h:g.height},{x:g.offset+g.width+z/2,y:g.sillHeight+g.height/2,w:z,h:g.height},{x:g.offset+g.width/2,y:g.sillHeight+g.height+z/2,w:g.width,h:z}].filter(A=>A.x-A.w/2>=-1e-8&&A.x+A.w/2<=w+1e-8&&A.y+A.h/2<=t.height+1e-8);return h.jsx("group",{children:L.map((A,_)=>h.jsxs("mesh",{position:[A.x,A.y,i*.001],onClick:P=>{!f.current?.visible||P.delta>5||(P.stopPropagation(),r(g.id))},children:[h.jsx("boxGeometry",{args:[A.w,A.h,.008]}),h.jsx("meshStandardMaterial",{color:l?"#4769c7":x,roughness:.63})]},_))},g.id)})]})}function fi({previous:t,next:e,openings:i,winding:o,mode:n,x:s,z:l}){const r=d.useRef(null),f=d.useMemo(()=>{const u=ri(t,e,o);return u?Oe(u):null},[t,e,o]);if(At(({camera:u})=>{r.current&&(r.current.visible=n==="all"||n==="cut"&&ee(t,o,u.position,s,l)<.05&&ee(e,o,u.position,s,l)<.05)}),!f)return null;const p=Xt(ie,e.materialId,"paint-white"),w=St(t.start,t.end),y=$t(t,i).filter(u=>u.end===w),E=$t(e,i).filter(u=>u.start===0);return h.jsx("group",{ref:r,children:y.flatMap(u=>E.map(S=>{const b=Math.max(u.bottom,S.bottom),m=Math.min(u.top,S.top);return m-b>1e-8&&h.jsxs("mesh",{position:[0,b,0],rotation:[-Math.PI/2,0,0],castShadow:!0,receiveShadow:!0,children:[h.jsx("extrudeGeometry",{args:[f,{depth:m-b,bevelEnabled:!1}]}),h.jsx("meshStandardMaterial",{...p})]},b)}))})}function mi({room:t,assets:e,selection:i,select:o,walls:n,ceiling:s,center:l,visibleIds:r}){const f=i?.roomId===t.id?i:null,p=Math.sign(Ge(t.floorPolygon)),w=()=>o({roomId:t.id,kind:"room"}),y=t.origin.x-l.x,E=t.origin.z-l.z;return h.jsxs("group",{position:[y,0,E],children:[h.jsx(Pe,{points:t.floorPolygon,altitude:-.08,depth:.08,material:Xt(Ne,t.floorMaterial,"concrete"),onSelect:w}),s&&h.jsx(Pe,{points:t.floorPolygon,altitude:t.wallHeight,depth:.06,material:Xt(ie,t.ceilingMaterial,"paint-white"),onSelect:w}),t.walls.map((u,S)=>h.jsx(fi,{previous:t.walls[(S+t.walls.length-1)%t.walls.length],next:u,openings:t.openings,winding:p,mode:n,x:y,z:E},u.id)),t.walls.map((u,S)=>h.jsx(pi,{wall:u,room:t,winding:p,mode:n,worldX:y,worldZ:E,selected:f?.kind==="wall"&&f.index===S||f?.kind==="opening"&&t.openings.some(b=>b.id===f.itemId&&b.wallId===u.id),onSelect:b=>o(b?{roomId:t.id,kind:"opening",itemId:b}:{roomId:t.id,kind:"wall",index:S})},u.id)),t.objects.filter(u=>r.has(u.id)).map(u=>h.jsx(ui,{object:u,asset:e.find(S=>S.id===u.assetId),selected:f?.kind==="object"&&qt(f).includes(u.id),onSelect:S=>o({roomId:t.id,kind:"object",itemId:u.id},S)},u.id))]})}const gi={orbit:"Órbita",iso:"Isométrica",top:"Superior",eye:"Ao nível dos olhos"};function wi(t){const e=t.rooms.flatMap(s=>s.floorPolygon.map(l=>ze(l,s)));if(!e.length)return{center:{x:0,z:0},radius:2,height:2.5};const i=je(e),o=Math.max(...t.rooms.map(s=>s.wallHeight)),n=Math.max(...t.rooms.flatMap(s=>s.walls.map(l=>l.thickness)));return{center:{x:(i.maxX+i.minX)/2,z:(i.maxZ+i.minZ)/2},radius:Math.max(.25,Math.hypot((i.maxX-i.minX)/2+n,(i.maxZ-i.minZ)/2+n,o/2+.08)),height:o}}function yi({framing:t,origin:e,project:i,selection:o,preset:n,action:s,adaptive:l}){const r=n==="iso"||n==="top",f=d.useRef(null),p=T(b=>b.camera),w=T(b=>b.size),y=T(b=>b.invalidate),E=d.useRef({framing:t,origin:e,project:i,selection:o});E.current={framing:t,origin:e,project:i,selection:o};const u=i.rooms.length>0,S=d.useRef(void 0);return d.useLayoutEffect(()=>{const b=f.current;if(!b||r!==p instanceof Mt)return;if(s!==S.current&&s.kind!=="fit"&&S.current){const V=s.kind==="in"?1.24:.8064516129032259;if(p instanceof Mt)p.zoom=Math.max(.06,Math.min(120,p.zoom*V));else{const G=p.position.clone().sub(b.target);p.position.copy(b.target).add(G.setLength(Math.max(.04,Math.min(b.maxDistance,G.length()/V))))}p.updateProjectionMatrix(),b.update(),S.current=s,y();return}S.current=s;const{framing:m,origin:g,project:z,selection:x}=E.current,{height:L,radius:A,center:_}=m,P=Math.max(.05,w.width/Math.max(1,w.height)),X=n==="top"?new v(0,1,1e-4):n==="iso"?new v(1,1,1):new v(1.05,.86,1.28),Y=new v(_.x-g.x,L/2,_.z-g.z),rt=p instanceof Vt?p.fov*Math.PI/360:Math.PI/8,H=A*1.14/Math.sin(Math.min(rt,Math.atan(Math.tan(rt)*P)));if(p.position.copy(Y).add(X.setLength(H)),p.near=Math.min(.025,A/80),p.far=Math.max(40,H+A*10),p.zoom=1,p instanceof Mt){const V=A*1.12/Math.min(1,P);p.left=-V*P,p.right=V*P,p.top=V,p.bottom=-V}const J=z.rooms.find(V=>V.id===x?.roomId)??z.rooms[0];if(n==="eye"&&J){const V=en(J.floorPolygon),G=J.floorPolygon.reduce((B,st)=>Math.hypot(st.x-V.x,st.z-V.z)>Math.hypot(B.x-V.x,B.z-V.z)?st:B),I=ze(V,J),it=Math.min(1.62,J.wallHeight*.74);p.position.set(I.x-g.x,it,I.z-g.z),Y.copy(p.position).add(new v((G.x-V.x)*.5,0,(G.z-V.z)*.5))}b.target.copy(Y),p.updateProjectionMatrix(),b.update(),y()},[s,p,u,y,r,n,i.id,w.height,w.width]),h.jsxs(h.Fragment,{children:[r&&h.jsx(Kn,{makeDefault:!0,manual:!0}),h.jsx(jn,{ref:f,makeDefault:!0,regress:l,enableRotate:!r,enableDamping:!0,minDistance:.04,maxDistance:Math.max(45,t.radius*40),minZoom:.06,maxZoom:120,minPolarAngle:0,maxPolarAngle:Math.PI/2})]})}function xi({onFailure:t}){const e=T(i=>i.gl);return d.useEffect(()=>{const i=e.domElement;return i.addEventListener("webglcontextlost",t),()=>i.removeEventListener("webglcontextlost",t)},[e,t]),null}function Ei({project:t,committed:e,selection:i,select:o,walls:n,onWallsChange:s,onPreview:l,onCommit:r,captureSlot:f}){const[p,w]=d.useState(),[y,E]=d.useState("orbit"),[u,S]=d.useState({kind:"fit"}),[b,m]=d.useState(!1),[g,z]=d.useState(),[x,L]=d.useState(),A=window.matchMedia("(pointer: coarse)").matches,_=t.settings.quality??"auto",P=_==="auto",X=_==="low"||P&&A,Y=x??!X,rt=g??(!X&&t.assets.some(C=>C.kind==="glb")),H=_==="high"?1.85:X?1:1.45,J=_==="high"?2048:X?512:1024,V=t.settings.objectLimit3D??(X?100:250),G=d.useMemo(()=>{const C=i?.kind==="object"?new Set(qt(i)):new Set,ft=t.rooms.flatMap(nt=>nt.objects.filter(Dt=>Dt.visible)),Ct=[...ft.filter(nt=>C.has(nt.id)),...ft.filter(nt=>!C.has(nt.id))];return{skipped:Math.max(0,Ct.length-V),ids:new Set(Ct.slice(0,V).map(nt=>nt.id))}},[V,t.rooms,i]),[I,it]=d.useState(!1),[B,st]=d.useState(0),[W,Q]=d.useState(!1),M=d.useMemo(()=>wi(t),[t]),R=d.useRef({projectId:t.id,center:M.center,filled:t.rooms.length>0});(R.current.projectId!==t.id||R.current.filled!==!!t.rooms.length)&&(R.current={projectId:t.id,center:M.center,filled:!!t.rooms.length});const O=R.current.center,a=M.radius,U=Math.max(8,Math.ceil(a*4)),tt=a*1.5,ot=t.rooms.find(C=>C.id===i?.roomId)??t.rooms[0],et=ot&&je(ot.floorPolygon),ht=e.rooms.find(C=>C.id===i?.roomId),F=i?.kind==="object"?ht?.objects.filter(C=>qt(i).includes(C.id))??[]:[],Z=F.some(C=>C.visible)&&F.every(C=>!C.locked),lt=t.settings.unit,at=h.jsxs("div",{className:"viewer-message",role:"status",children:[h.jsx("strong",{children:"O navegador não conseguiu iniciar a vista 3D."}),h.jsx("p",{children:"A planta e as propriedades estão disponíveis. Ative o WebGL ou volte a tentar."}),h.jsx("button",{className:"secondary",onClick:()=>{it(!1),Q(!1),st(C=>C+1)},children:"Voltar a tentar"})]});return h.jsxs("section",{className:"viewer-frame","aria-label":"Visualização 3D",children:[!I&&h.jsxs(qe,{fallback:at,children:[h.jsxs(En,{frameloop:"demand",dpr:[1,H],shadows:Y,performance:{min:.7,debounce:330},camera:{fov:42,position:[6,5,7]},gl:{alpha:!1,antialias:!0,powerPreference:"low-power"},onCreated:()=>Q(!0),children:[h.jsx(ni,{slot:f}),P&&h.jsx(ei,{}),rt&&h.jsx(Pn,{size:_==="high"?256:X?64:128}),h.jsx(xi,{onFailure:()=>it(!0)}),h.jsx("color",{attach:"background",args:["#e9edf4"]}),h.jsx("hemisphereLight",{args:["#f5f8ff","#a8a095",1.45]}),h.jsx("directionalLight",{position:[a*.9,a*2.2,a*1.15],intensity:2.2,color:"#fff4e5",castShadow:Y,"shadow-mapSize":[J,J],"shadow-bias":-2e-4,"shadow-normalBias":.015,"shadow-camera-left":-tt,"shadow-camera-right":tt,"shadow-camera-top":tt,"shadow-camera-bottom":-tt,"shadow-camera-near":.02,"shadow-camera-far":a*6+4},J),h.jsx(yi,{framing:M,origin:O,project:t,selection:i,preset:y,action:u,adaptive:P}),t.settings.grid&&h.jsx("gridHelper",{args:[U,Math.min(80,U*2),"#a8b8ce","#ccd5e2"],position:[M.center.x-O.x,-.087,M.center.z-O.z]}),Y&&h.jsxs("mesh",{rotation:[-Math.PI/2,0,0],position:[0,-.09,0],receiveShadow:!0,children:[h.jsx("planeGeometry",{args:[U*2,U*2]}),h.jsx("shadowMaterial",{transparent:!0,opacity:.17})]}),p&&Z&&ht&&h.jsx(si,{room:ht,objects:F,center:O,mode:p,snap:t.settings.snap,onPreview:l,onCommit:r},`${ht.id}-${F.map(C=>C.id).join("-")}-${y}-${p}`),t.rooms.map(C=>h.jsx(mi,{room:C,assets:t.assets,selection:i,select:o,walls:n,ceiling:b,center:O,visibleIds:G.ids},C.id))]}),!W&&h.jsx("span",{className:"sr-only",role:"status",children:"A preparar a vista 3D…"})]},B),I&&at,h.jsxs("div",{className:"viewer-tools",children:[h.jsxs("label",{className:"viewer-control",children:[h.jsx(Ln,{size:16}),h.jsx("span",{className:"sr-only",children:"Câmara 3D"}),h.jsx("select",{value:y,onChange:C=>{E(C.target.value),S({kind:"fit"})},children:Object.entries(gi).map(([C,ft])=>h.jsx("option",{value:C,children:ft},C))})]}),h.jsxs("label",{className:"viewer-control",children:[h.jsx($e,{size:16}),h.jsx("span",{className:"sr-only",children:"Visibilidade das paredes"}),h.jsxs("select",{value:n,onChange:C=>s(C.target.value),children:[h.jsx("option",{value:"cut",children:"Corte automático"}),h.jsx("option",{value:"all",children:"Todas as paredes"}),h.jsx("option",{value:"hidden",children:"Sem paredes"})]})]}),h.jsxs("details",{className:"viewer-options",children:[h.jsx("summary",{children:"Opções 3D"}),h.jsxs("div",{children:[h.jsxs("label",{children:[h.jsx("input",{type:"checkbox",checked:b,onChange:C=>m(C.target.checked)})," Teto"]}),h.jsxs("label",{children:[h.jsx("input",{type:"checkbox",checked:Y,onChange:C=>L(C.target.checked)})," Sombras"]}),h.jsxs("label",{children:[h.jsx("input",{type:"checkbox",checked:rt,onChange:C=>z(C.target.checked)})," Reflexos de estúdio"]})]})]})]}),Z&&h.jsxs("div",{className:"gizmo-tools",role:"group","aria-label":"Transformar objetos em 3D",children:[h.jsx("button",{className:"icon-button",title:"Mover em 3D","aria-label":"Mover em 3D","aria-pressed":p==="translate",onClick:()=>w(p==="translate"?void 0:"translate"),children:h.jsx(In,{size:17})}),h.jsx("button",{className:"icon-button",title:"Rodar em 3D","aria-label":"Rodar em 3D","aria-pressed":p==="rotate",onClick:()=>w(p==="rotate"?void 0:"rotate"),children:h.jsx(An,{size:17})})]}),G.skipped>0&&h.jsxs("span",{className:"viewer-budget",role:"status",children:[G.skipped," ",G.skipped===1?"objeto omitido":"objetos omitidos"," pelo limite 3D"]}),W&&!ot&&h.jsx("div",{className:"empty-plan",children:"Crie uma divisão para a ver em 3D."}),W&&ot&&et&&h.jsxs("div",{className:"model-scale","aria-label":"Dimensões da divisão em 3D",children:[h.jsx("strong",{children:ot.name}),h.jsxs("span",{children:[Bt(et.maxX-et.minX,lt)," × ",Bt(et.maxZ-et.minZ,lt)," × ",Bt(ot.wallHeight,lt)]})]}),h.jsxs("div",{className:"map-controls",role:"group","aria-label":"Navegação 3D",children:[h.jsx("button",{type:"button",title:"Afastar em 3D","aria-label":"Afastar em 3D",onClick:()=>S({kind:"out"}),children:h.jsx(Je,{size:17})}),h.jsx("button",{type:"button",title:"Aproximar em 3D","aria-label":"Aproximar em 3D",onClick:()=>S({kind:"in"}),children:h.jsx(Ke,{size:17})}),h.jsx("button",{type:"button",title:"Enquadrar em 3D","aria-label":"Enquadrar em 3D",onClick:()=>S({kind:"fit"}),children:h.jsx(tn,{size:17})})]})]})}export{Ei as Viewer,wi as sceneBounds};
