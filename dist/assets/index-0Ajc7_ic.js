const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BzkNtf0J.js","assets/shared-BQ7KWafL.js","assets/index-CDoIlnPm.js","assets/student-BklnzfRq.js","assets/index-C0fDepW1.js"])))=>i.map(i=>d[i]);
import{i as E}from"./student-BklnzfRq.js";import{i as L,s as I}from"./shared-BQ7KWafL.js";(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))e(t);new MutationObserver(t=>{for(const o of t)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&e(i)}).observe(document,{childList:!0,subtree:!0});function h(t){const o={};return t.integrity&&(o.integrity=t.integrity),t.referrerPolicy&&(o.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?o.credentials="include":t.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function e(t){if(t.ep)return;t.ep=!0;const o=h(t);fetch(t.href,o)}})();document.addEventListener("DOMContentLoaded",function(){T()});function T(){console.log("🎨 Initializing GSAP animations..."),document.querySelectorAll(".section").forEach(h=>{h.classList.contains("active")?gsap.set(h,{opacity:1,y:0,scale:1}):gsap.set(h,{opacity:0,y:30,scale:.95})}),_(),W(),D(),P(),H();const c=document.querySelector("#login-section.active");c&&(gsap.set(c,{opacity:1,y:0,scale:1}),c.querySelectorAll(".btn").forEach(e=>{gsap.set(e,{opacity:1})})),console.log("✅ GSAP animations initialized")}function _(){document.querySelectorAll(".section").forEach(c=>{new MutationObserver(e=>{e.forEach(t=>{t.type==="attributes"&&t.attributeName==="class"&&(c.classList.contains("active")?B(c):A(c))})}).observe(c,{attributes:!0})})}function B(g){gsap.timeline().set(g,{display:"block"}).to(g,{opacity:1,y:0,scale:1,duration:.6,ease:"power2.out",onComplete:()=>{g.querySelectorAll(".btn").forEach(h=>{gsap.set(h,{opacity:1})})}})}function A(g){gsap.to(g,{opacity:0,y:30,scale:.95,duration:.4,ease:"power2.in",onComplete:()=>{gsap.set(g,{display:"none"})}})}function W(){gsap.from(".logo",{opacity:0,y:-30,scale:.8,duration:1,ease:"back.out(1.7)",delay:.1}),gsap.from(".login-form",{opacity:0,y:50,duration:.8,ease:"power2.out",delay:.4}),gsap.from(".form-group",{opacity:0,x:-30,duration:.6,stagger:.1,ease:"power2.out",delay:.6}),gsap.from(".btn",{opacity:0,duration:.5,stagger:.1,ease:"back.out(1.7)",delay:.8})}function D(){document.querySelectorAll(".btn").forEach(c=>{c.addEventListener("mouseenter",()=>{gsap.to(c,{scale:1.05,duration:.2,ease:"power2.out"})}),c.addEventListener("mouseleave",()=>{gsap.to(c,{scale:1,duration:.2,ease:"power2.out"})}),c.addEventListener("mousedown",()=>{gsap.to(c,{scale:.95,duration:.1,ease:"power2.in"})}),c.addEventListener("mouseup",()=>{gsap.to(c,{scale:1.05,duration:.1,ease:"power2.out"})})})}function P(){document.querySelectorAll("input, select, textarea").forEach(c=>{c.addEventListener("focus",()=>{gsap.to(c,{scale:1.02,y:-2,duration:.2,ease:"power2.out"})}),c.addEventListener("blur",()=>{gsap.to(c,{scale:1,y:0,duration:.2,ease:"power2.out"})})})}function H(){document.querySelectorAll(".card, .test-item, .subject-item").forEach((c,h)=>{gsap.set(c,{opacity:0,y:30,scale:.9}),gsap.to(c,{opacity:1,y:0,scale:1,duration:.6,delay:h*.1,ease:"power2.out"}),c.addEventListener("mouseenter",()=>{gsap.to(c,{y:-5,scale:1.02,duration:.3,ease:"power2.out"})}),c.addEventListener("mouseleave",()=>{gsap.to(c,{y:0,scale:1,duration:.3,ease:"power2.out"})})})}function z(g){const c=g.querySelectorAll("tr");gsap.from(c,{opacity:0,x:-50,duration:.5,stagger:.05,ease:"power2.out"})}function M(g){gsap.timeline().set(g,{display:"flex"}).from(g,{opacity:0,scale:.8,duration:.4,ease:"back.out(1.7)"})}function q(g,c){gsap.to(g,{opacity:0,scale:.8,duration:.3,ease:"back.in(1.7)",onComplete:()=>{gsap.set(g,{display:"none"}),c&&c()}})}function O(g,c="success"){gsap.timeline().set(g,{display:"block",opacity:0,y:-20,scale:.9}).to(g,{opacity:1,y:0,scale:1,duration:.4,ease:"back.out(1.7)"}).to(g,{opacity:0,y:-20,scale:.9,duration:.3,ease:"power2.in",delay:3})}function N(g){gsap.to(g,{opacity:.6,scale:.98,duration:.3,ease:"power2.out"})}function R(g){gsap.to(g,{opacity:1,scale:1,duration:.3,ease:"power2.out"})}function K(g,c){gsap.timeline().to(g,{opacity:0,y:-30,scale:.95,duration:.4,ease:"power2.in"}).set(g,{display:"none"}).set(c,{display:"block"}).to(c,{opacity:1,y:0,scale:1,duration:.6,ease:"power2.out"})}window.GSAPAnimations={animateSectionIn:B,animateSectionOut:A,animateTableRows:z,animateModalIn:M,animateModalOut:q,animateMessage:O,animateLoading:N,stopLoading:R,animatePageTransition:K};(function(){function g(){return new Promise((h,e)=>{if(typeof Konva<"u"){h();return}if(document.querySelector('script[src*="konva"]')){const s=setInterval(()=>{typeof Konva<"u"&&(clearInterval(s),h())},100);setTimeout(()=>{clearInterval(s),e(new Error("Timeout waiting for Konva.js to load"))},1e4);return}const t=["https://unpkg.com/konva@9.2.3/konva.min.js","https://cdn.jsdelivr.net/npm/konva@9.2.3/konva.min.js","https://cdnjs.cloudflare.com/ajax/libs/konva/9.2.3/konva.min.js","https://unpkg.com/konva@latest/konva.min.js"];let o=0;function i(){if(o>=t.length){e(new Error("All CDN sources failed to load Konva.js"));return}const s=document.createElement("script");s.src=t[o],s.onload=()=>{console.log(`Konva.js loaded successfully from: ${t[o]}`),h()},s.onerror=()=>{console.warn(`Failed to load Konva.js from: ${t[o]}`),o++,i()},setTimeout(()=>{s.parentNode&&(s.parentNode.removeChild(s),o++,i())},8e3),document.head.appendChild(s)}i()})}class c{constructor(e){this.container=e,this.image=null,this.blocks=[],this.words=[],this.arrows=[],this.isUploading=!1,this.currentBlockId=0,this.currentArrowId=0,this.isDrawingArrow=!1,this.arrowStart=null,this.selectedShape=null,this.stage=null,this.layer=null,this.imageLayer=null,this.blocksLayer=null,this.arrowsLayer=null,this.backgroundLayer=null,this.resizing=!1,this.resizeDir=null,this.startPos=null,this.startRect=null,this.currentArrow=null,this.init()}snapToGrid(e,t){return Math.round(e/t)*t}async init(){console.log("🚀 Initializing MatchingTestWidget..."),console.log("📋 Container element:",this.container),this.render(),console.log("🎨 HTML rendered"),this.bindEvents(),console.log("🔗 Events bound");try{console.log("📦 Loading Konva.js library..."),await g(),console.log("✅ Konva.js loaded successfully"),this.initKonva(),this.hideLoadingIndicator(),console.log("🎨 Konva.js initialization complete")}catch(e){console.error("❌ Failed to load Konva.js:",e),this.showError("Failed to load graphics library. Please check your internet connection and try again.")}}render(){console.log("🎨 Starting render method..."),this.container.innerHTML=`
        <div class="matching-test-widget">
          <style>
            .matching-test-widget {
              font-family: Arial, sans-serif;
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
              position: relative;
            }
            .loading-indicator {
              text-align: center;
              padding: 40px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 2px dashed #dee2e6;
            }
            .loading-spinner {
              display: inline-block;
              width: 40px;
              height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #007bff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .loading-text {
              color: #6c757d;
              font-size: 16px;
              font-weight: 500;
            }
            .image-uploader {
              margin-bottom: 20px;
              padding: 20px;
              border: 2px dashed #ccc;
              border-radius: 8px;
              text-align: center;
              transition: all 0.3s ease;
            }
            .image-uploader.dragover {
              border-color: #007bff;
              background-color: #f8f9fa;
              transform: scale(1.02);
            }
            .editor-controls {
              margin-bottom: 15px;
              text-align: center;
              padding: 15px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 8px;
            }
            .editor-controls h4 {
              color: white;
              margin: 0 0 15px 0;
              font-size: 18px;
            }
            .control-buttons {
              display: flex;
              gap: 10px;
              justify-content: center;
              flex-wrap: wrap;
            }
            .btn {
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .btn-primary {
              background: linear-gradient(135deg, #007bff, #0056b3);
              color: white;
            }
            .btn-secondary {
              background: linear-gradient(135deg, #6c757d, #545b62);
              color: white;
            }
            .btn-success {
              background: linear-gradient(135deg, #28a745, #1e7e34);
              color: white;
            }
            .btn-warning {
              background: linear-gradient(135deg, #ffc107, #e0a800);
              color: #212529;
            }
            .btn.active {
              background: linear-gradient(135deg, #28a745, #1e7e34);
              transform: scale(1.05);
            }
            .image-editor {
              position: relative;
              margin: 20px 0;
              border: 2px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .konva-container {
              width: 100%;
              height: 500px;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              background: #f8f9fa;
              position: relative;
              overflow: hidden;
            }
            #konvaContainer {
              width: 100%;
              height: 100%;
              position: relative;
            }
            

            .words-editor {
              margin-top: 20px;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .word-item {
              display: flex;
              align-items: center;
              margin: 15px 0;
              padding: 15px;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              transition: all 0.3s ease;
            }
            .word-item:hover {
              border-color: #007bff;
              transform: translateX(5px);
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .word-number {
              background: linear-gradient(135deg, #007bff, #0056b3);
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(0,123,255,0.3);
            }
            .word-input {
              flex: 1;
              padding: 12px;
              border: 2px solid #e9ecef;
              border-radius: 6px;
              margin-right: 15px;
              font-size: 16px;
              transition: all 0.3s ease;
            }
            .word-input:focus {
              outline: none;
              border-color: #007bff;
              box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
            }
            .upload-status {
              margin-top: 15px;
              padding: 15px;
              border-radius: 8px;
              font-weight: 500;
              text-align: center;
              transition: all 0.3s ease;
            }
            .upload-status.uploading {
              background: linear-gradient(135deg, #fff3cd, #ffeaa7);
              border: 2px solid #ffc107;
              color: #856404;
            }
            .upload-status.success {
              background: linear-gradient(135deg, #d4edda, #c3e6cb);
              border: 2px solid #28a745;
              color: #155724;
            }
            .upload-status.error {
              background: linear-gradient(135deg, #f8d7da, #f5c6cb);
              border: 2px solid #dc3545;
              color: #721c24;
            }
            .action-buttons {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
              margin-top: 25px;
              padding-top: 20px;
              border-top: 2px solid #e9ecef;
            }
            .action-buttons .btn {
              min-width: 140px;
              font-size: 16px;
              padding: 12px 24px;
            }

            
            .editor-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            
            .editor-controls {
              margin-bottom: 20px;
              padding: 15px;
              background-color: #e9ecef;
              border-radius: 5px;
            }
            
            .control-buttons {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }
            
            .editor-content {
              display: grid;
              grid-template-columns: 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            
            .image-container {
              text-align: center;
            }
            
            .image-container img {
              max-width: 100%;
              max-height: 300px;
              border: 2px solid #dee2e6;
              border-radius: 5px;
            }
            
            /* Test Creation Loading Overlay Styles */
            .test-creation-loading-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
              backdrop-filter: blur(5px);
            }
            
            .loading-content {
              background: white;
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 500px;
              width: 90%;
            }
            
            .loading-content h3 {
              color: #333;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 600;
            }
            
            .loading-content p {
              color: #666;
              margin: 0 0 20px 0;
              font-size: 16px;
            }
            
            .loading-spinner {
              width: 60px;
              height: 60px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #007bff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            
            .progress-bar {
              width: 100%;
              height: 8px;
              background: #f3f3f3;
              border-radius: 4px;
              margin-top: 20px;
              overflow: hidden;
            }
            
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #007bff, #28a745);
              width: 0%;
              transition: width 0.3s ease;
            }
            

          </style>
          
          <div class="loading-indicator" id="loadingIndicator">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading graphics library...</div>
          </div>
          


          <!-- Photo upload section -->
          <div class="image-uploader" id="imageUploader" style="display: block;">
            <div class="upload-area" id="uploadArea">
              <div class="upload-icon">📷</div>
              <div class="upload-text">Click to upload an image or drag and drop</div>
              <input type="file" id="imageFileInput" accept="image/*" style="display: none;">
            </div>
            <!-- Upload status display -->
            <div id="uploadStatus" class="upload-status" style="display: none;"></div>
          </div>

          <!-- Image editor (initially hidden) -->
          <div id="imageEditor" class="image-editor" style="display: none;">
            <div class="editor-header">
              <h4>🖼️ Image Editor</h4>
              <button class="btn btn-sm btn-secondary" id="resetImageBtn">Reset</button>
            </div>
            <div class="editor-controls">
              <h4>🎨 Editor Tools</h4>
              <div class="control-buttons">
                <button class="btn btn-primary" id="addBlockBtn">Add Block</button>
                <button class="btn btn-secondary" id="addArrowBtn">Add Arrow</button>
                <button class="btn btn-warning" id="clearAllBtn">Clear All</button>
                <button class="btn btn-danger" id="deleteBlockBtn" style="display: none;">Delete Block</button>
              </div>
            </div>
            <div class="editor-content">
              <div class="konva-container">
                <div id="konvaContainer"></div>
              </div>
            </div>
          </div>

          <!-- Words editor -->
          <div id="wordsEditor" class="words-editor" style="display: none;">
            <h4>Words to Match</h4>
            <div id="wordsList">
              <!-- Word inputs will be generated here -->
            </div>
          </div>

          <!-- Action buttons positioned below words editor -->
          <div id="actionButtonsContainer" class="action-buttons" style="display: none;">
            <button class="btn btn-danger" id="deleteArrowBtn" style="display: none;">Delete Arrow</button>
            <button class="btn btn-success" id="createTestBtn">Create Test</button>
          </div>
        </div>
      `,console.log("🎨 HTML rendered successfully"),console.log("🔍 Elements found:"),console.log("  - Loading indicator:",this.container.querySelector("#loadingIndicator")),console.log("  - Image uploader:",this.container.querySelector("#imageUploader")),console.log("  - Image editor:",this.container.querySelector("#imageEditor")),console.log("  - Words editor:",this.container.querySelector("#wordsEditor")),console.log("  - Action buttons container:",this.container.querySelector("#actionButtonsContainer")),console.log("  - Create test button:",this.container.querySelector("#createTestBtn")),console.log("  - Cancel test creation button:",this.container.querySelector("#cancelTestCreationMatching"))}bindEvents(){console.log("🔗 Starting bindEvents method...");const e=this.container.querySelector("#imageUploader"),t=this.container.querySelector("#imageFileInput"),o=this.container.querySelector("#addBlockBtn"),i=this.container.querySelector("#addArrowBtn"),s=this.container.querySelector("#clearAllBtn"),n=this.container.querySelector("#createTestBtn"),a=document.getElementById("cancelTestCreationMatching"),r=this.container.querySelector("#deleteBlockBtn"),l=this.container.querySelector("#deleteArrowBtn");o&&(o.addEventListener("click",()=>{console.log("🖱️ Add block button clicked"),this.enableBlockMode()}),console.log("✅ Add block button event bound")),i&&(i.addEventListener("click",()=>{console.log("🖱️ Add arrow button clicked"),this.enableArrowMode()}),console.log("✅ Add arrow button event bound")),s&&(s.addEventListener("click",()=>{console.log("🖱️ Clear all button clicked"),this.clearAll()}),console.log("✅ Clear all button event bound")),n&&(n.addEventListener("click",()=>{console.log("🖱️ Create test button clicked"),this.createTest()}),console.log("✅ Create test button event bound")),a&&(a.addEventListener("click",()=>{console.log("🖱️ Cancel test creation button clicked"),this.cancelTestCreation()}),console.log("✅ Cancel test creation button event bound")),r&&(r.addEventListener("click",()=>{console.log("🖱️ Delete block button clicked"),this.deleteSelectedBlock()}),console.log("✅ Delete block button event bound")),l&&(l.addEventListener("click",()=>{console.log("🖱️ Delete arrow button clicked"),this.deleteSelectedArrow()}),console.log("✅ Delete arrow button event bound"));const d=this.container.querySelector("#resetImageBtn");d&&(d.addEventListener("click",()=>{console.log("🖱️ Reset image button clicked"),this.resetImage()}),console.log("✅ Reset image button event bound")),e&&e.addEventListener("click",()=>{console.log("🖱️ Image uploader clicked"),t.click()}),t&&t.addEventListener("change",u=>{console.log("📁 Image file selected:",u.target.files[0]),this.handleImageUpload(u)}),e&&(e.addEventListener("dragover",u=>{u.preventDefault(),e.classList.add("dragover")}),e.addEventListener("dragleave",()=>{e.classList.remove("dragover")}),e.addEventListener("drop",u=>{u.preventDefault(),e.classList.remove("dragover");const p=u.dataTransfer.files;p.length>0&&(console.log("📁 Image dropped:",p[0]),this.handleImageFile(p[0]))})),console.log("🔗 All events bound successfully")}initKonva(){const e=this.container.querySelector("#konvaContainer");if(!e){console.error("❌ Konva container not found!");return}console.log("🔧 Konva container found:",e),console.log("🔧 Container dimensions:",{offsetWidth:e.offsetWidth,offsetHeight:e.offsetHeight,clientWidth:e.clientWidth,clientHeight:e.clientHeight});const t=()=>{e.style.display="block",e.offsetHeight;const n=e.offsetWidth||e.clientWidth||800,a=e.offsetHeight||e.clientHeight||600;return console.log("🔧 Calculated container dimensions:",{width:n,height:a}),{width:n,height:a}};let{width:o,height:i}=t();(o===0||i===0)&&(console.log("⚠️ Container dimensions are 0, using defaults and will resize later"),o=800,i=600),this.stage=new Konva.Stage({container:e,width:o,height:i});try{this.stage.listening(!0)}catch{}console.log("🔧 Konva stage created:",this.stage),console.log("🔧 Stage dimensions:",{width:this.stage.width(),height:this.stage.height()}),this.stageWidth=this.stage.width(),this.stageHeight=this.stage.height(),this.backgroundLayer=new Konva.Layer,this.imageLayer=new Konva.Layer,this.blocksLayer=new Konva.Layer({listening:!0}),this.arrowsLayer=new Konva.Layer;try{this.blocksLayer.listening(!0),this.blocksLayer.hitGraphEnabled&&this.blocksLayer.hitGraphEnabled(!0)}catch{}this.stage.add(this.backgroundLayer),this.stage.add(this.imageLayer),this.stage.add(this.blocksLayer),this.stage.add(this.arrowsLayer);const s=new Konva.Rect({x:0,y:0,width:this.stage.width(),height:this.stage.height(),fill:"#f8f9fa",stroke:"#dee2e6",strokeWidth:1,listening:!1});this.backgroundLayer.add(s),this.setupStageEvents(),this.handleResize=()=>{const n=e.offsetWidth||e.clientWidth||800,a=e.offsetHeight||e.clientHeight||600;if(n!==this.stageWidth||a!==this.stageHeight){console.log("🔄 Resizing stage from",{width:this.stageWidth,height:this.stageHeight},"to",{width:n,height:a}),this.stage.width(n),this.stage.height(a),this.stageWidth=n,this.stageHeight=a,this.backgroundLayer.destroyChildren();const r=new Konva.Rect({x:0,y:0,width:n,height:a,fill:"#f8f9fa",stroke:"#dee2e6",strokeWidth:1,listening:!1});this.backgroundLayer.add(r),this.imageInfo&&this.recenterImage(),this.stage.batchDraw()}},window.addEventListener("resize",this.handleResize),this.resizeStageToContainer=()=>{const n=this.stage.container();if(!n)return;n.style.display="block",n.offsetHeight;const a=n.offsetWidth||n.clientWidth||800,r=n.offsetHeight||n.clientHeight||600;if(console.log("🔄 Resizing stage to container dimensions:",{width:a,height:r}),a>0&&r>0&&(a!==this.stageWidth||r!==this.stageHeight)){this.stage.width(a),this.stage.height(r),this.stageWidth=a,this.stageHeight=r,this.backgroundLayer.destroyChildren();const l=new Konva.Rect({x:0,y:0,width:a,height:r,fill:"#f8f9fa",stroke:"#dee2e6",strokeWidth:1,listening:!1});this.backgroundLayer.add(l),this.imageInfo&&this.recenterImage(),this.stage.batchDraw()}},console.log("✅ Konva initialization complete")}setupStageEvents(){this.stage.on("click",e=>{e.target===this.stage&&(console.log("🖱️ Clicked on stage background, deselecting all"),this.deselectAll())}),this.stage.on("dragmove",()=>{this.stage.batchDraw()})}handleEdgeDetection(e){console.log("🔍 Edge detection called at position:",e);let t=null,o="default";this.resizeDir=null;for(let a=this.blocks.length-1;a>=0;a--){const r=this.blocks[a],d=r.rect.getClientRect(),u=20;if(e.x>=d.x-u&&e.x<=d.x+d.width+u&&e.y>=d.y-u&&e.y<=d.y+d.height+u){t=r,console.log("🔍 Cursor over block:",r.id,"box:",d);break}}if(!t){this.stage.container().style.cursor="default",this.hoveredBlock=null;return}const s=t.rect.getClientRect(),n=8;console.log("🔍 Checking edges for block:",t.id,"margin:",n),Math.abs(e.x-s.x)<n?(o="ew-resize",this.resizeDir="left",console.log("🔍 LEFT edge detected")):Math.abs(e.x-(s.x+s.width))<n?(o="ew-resize",this.resizeDir="right",console.log("🔍 RIGHT edge detected")):Math.abs(e.y-s.y)<n?(o="ns-resize",this.resizeDir="top",console.log("🔍 TOP edge detected")):Math.abs(e.y-(s.y+s.height))<n?(o="ns-resize",this.resizeDir="bottom",console.log("🔍 BOTTOM edge detected")):(o="default",this.resizeDir=null),this.resizeDir?(console.log("🔍 Edge detected:",this.resizeDir,"on block:",t.id),this.hoveredBlock=t):this.hoveredBlock=null,this.stage.container().style.cursor=o}handleEdgeResize(e){if(!this.resizing||!this.resizeDir||!this.hoveredBlock)return;const t=this.stage.getPointerPosition();if(!t)return;const o=this.hoveredBlock.rect;let i=o.getAttrs();if(this.resizeDir==="right"?i.width=t.x-o.x():this.resizeDir==="bottom"?i.height=t.y-o.y():this.resizeDir==="left"?(i.width=o.width()+(o.x()-t.x),i.x=t.x):this.resizeDir==="top"&&(i.height=o.height()+(o.y()-t.y),i.y=t.y),i.width>20&&i.height>20){o.setAttrs(i);const s=this.blocks.find(n=>n.id===this.hoveredBlock.id);s&&(s.width=i.width,s.height=i.height,s.x=i.x,s.y=i.y),this.stage.batchDraw()}}async handleImageUpload(e){const t=e.target.files[0];t&&this.handleImageFile(t)}async handleImageFile(e){console.log("📁 Handling image file:",e.name,e.size,"bytes"),this.showUploadStatus("Uploading image to Cloudinary...","uploading");try{const t=await this.fileToDataUrl(e);console.log("📁 Converted file to data URL, length:",t.length);const o=await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/upload-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({dataUrl:t,folder:"matching_tests"})}),i=await o.json();if(o.ok&&i.success&&i.url)this.image=i.url,this.imageWidth=i.width,this.imageHeight=i.height,console.log("✅ Image uploaded to Cloudinary:",i.url),console.log("📏 Image dimensions stored:",this.imageWidth,"x",this.imageHeight),this.showUploadStatus("Image uploaded successfully!","success"),this.showImageEditor(),this.createWordsEditor(),this.loadImageToKonva(i.url);else throw new Error(i.message||"Upload failed")}catch(t){console.error("❌ Error uploading image:",t),this.showUploadStatus("Failed to upload image: "+t.message,"error")}}showUploadStatus(e,t){const o=this.container.querySelector("#uploadStatus");o.textContent=e,o.className=`upload-status ${t}`,o.style.display="block"}fileToDataUrl(e){return new Promise((t,o)=>{const i=new FileReader;i.onload=()=>t(i.result),i.onerror=()=>o(new Error("Failed to read file")),i.readAsDataURL(e)})}showImageEditor(){console.log("🎨 Showing image editor...");const e=this.container.querySelector("#imageEditor");e?(e.style.display="block",console.log("✅ Image editor displayed"),setTimeout(()=>{this.resizeStageToContainer()},100)):console.error("❌ Image editor not found!"),this.enableBlockMode()}loadImageToKonva(e){const t=new Image;t.onload=()=>{this.stageWidth===800&&this.stageHeight===600&&(console.log("🔄 Stage still has default dimensions, attempting to resize..."),this.resizeStageToContainer());const o=this.stageWidth||this.stage.width(),i=this.stageHeight||this.stage.height(),s=40,n=o-s,a=i-s,r=Math.min(n/t.width,a/t.height),l=t.width*r,d=t.height*r,u=(o-l)/2,p=(i-d)/2;console.log("🖼️ Image positioning:",{originalSize:{width:t.width,height:t.height},stageSize:{width:o,height:i},scaledSize:{width:l,height:d},position:{x:u,y:p},scale:r,padding:s});const f=new Konva.Image({x:u,y:p,image:t,width:l,height:d});this.imageLayer.destroyChildren(),this.imageLayer.add(f),this.imageInfo={x:u,y:p,width:l,height:d,scale:r,originalWidth:t.width,originalHeight:t.height},this.originalImageWidth=t.width,this.originalImageHeight=t.height,console.log("🖼️ Original image dimensions stored:",{width:this.originalImageWidth,height:this.originalImageHeight}),this.stage.batchDraw()},t.src=e}recenterImage(){if(!this.imageInfo)return;const e=this.stageWidth,t=this.stageHeight,o=(e-this.imageInfo.width)/2,i=(t-this.imageInfo.height)/2,s=this.imageLayer.getChildren()[0];s&&(s.x(o),s.y(i),this.imageInfo.x=o,this.imageInfo.y=i,console.log("🔄 Image re-centered to:",{x:o,y:i}))}enableBlockMode(){this.isDrawingArrow=!1,this.arrowStart=null,this.isCreatingBlock=!1,this.blockCreationStart=null,this.previewBlock=null,this.container.querySelector("#addBlockBtn").classList.add("active"),this.container.querySelector("#addArrowBtn").classList.remove("active"),this.stage.container().style.cursor="default",this.stage.off("click"),this.stage.off("mousedown"),this.stage.off("mousemove"),this.stage.off("mouseup"),this.stage.on("mousedown",e=>{try{console.log("🧪 Stage mousedown:",{targetIsStage:e.target===this.stage,targetClass:e.target&&e.target.getClassName&&e.target.getClassName(),targetId:e.target&&e.target.id&&e.target.id()})}catch{}if(e.target!==this.stage){try{console.log("🧪 Stage mousedown ignored. Target is not stage:",{targetClass:e.target&&e.target.getClassName&&e.target.getClassName(),targetId:e.target&&e.target.id&&e.target.id(),isInBlockGroup:!!(e.target&&e.target.findAncestor&&e.target.findAncestor(".block-group",!0))})}catch{}return}this.stage.getPointerPosition()&&this.handleBlockCreationStart(e)}),this.stage.on("mousemove",e=>{this.isCreatingBlock&&this.handleBlockCreationMove(e)}),this.stage.on("mouseup",e=>{this.isCreatingBlock&&this.handleBlockCreationEnd(e)}),console.log("🎯 Block mode enabled - click a block to select, click-drag to create sized blocks")}enableArrowMode(){this.isDrawingArrow=!0,this.arrowStart=null,this.isCreatingBlock=!1,this.blockCreationStart=null,this.previewBlock=null,this.container.querySelector("#addBlockBtn").classList.remove("active"),this.container.querySelector("#addArrowBtn").classList.add("active"),this.stage.container().style.cursor="crosshair",this.stage.off("click"),this.stage.off("mousedown"),this.stage.off("mousemove"),this.stage.off("mouseup"),this.stage.on("mousedown",e=>this.handleArrowMouseDown(e)),this.stage.on("mousemove",e=>{this.handleArrowMouseMove(e)}),this.stage.on("mouseup",e=>this.handleArrowMouseUp(e)),console.log("🎯 Arrow mode enabled - click and drag to draw arrows")}handleSingleClickStageClick(e){const t=this.stage.getPointerPosition();if(this.imageInfo&&t.x>=this.imageInfo.x&&t.x<=this.imageInfo.x+this.imageInfo.width&&t.y>=this.imageInfo.y&&t.y<=this.imageInfo.y+this.imageInfo.height){const o=this.findBlockAtPosition(t.x,t.y);o?(console.log("🖱️ Clicked on existing block:",o.id),this.selectShape(o.group)):(console.log("🆕 Creating simple block at:",t.x,t.y),this.createBlock(t.x,t.y,50,50))}}handleStageClick(e){const t=this.stage.getPointerPosition();if(this.imageInfo&&t.x>=this.imageInfo.x&&t.x<=this.imageInfo.x+this.imageInfo.width&&t.y>=this.imageInfo.y&&t.y<=this.imageInfo.y+this.imageInfo.height)if(this.isDrawingArrow)this.handleArrowClick(t.x,t.y);else{const o=this.findBlockAtPosition(t.x,t.y);o?(console.log("🖱️ Clicked on existing block:",o.id),this.selectShape(o.group)):(console.log("🆕 Creating new block at:",t.x,t.y),this.createBlock(t.x,t.y))}}handleBlockCreationStart(e){const t=this.stage.getPointerPosition();if(this.imageInfo&&t.x>=this.imageInfo.x&&t.x<=this.imageInfo.x+this.imageInfo.width&&t.y>=this.imageInfo.y&&t.y<=this.imageInfo.y+this.imageInfo.height){const o=this.findBlockAtPosition(t.x,t.y);if(o){console.log("🖱️ Clicked on existing block:",o.id);try{e&&(e.cancelBubble=!0,e.evt&&(e.evt.cancelBubble=!0)),this.selectShape(o.group),o.group.startDrag(),console.log("✅ Forced startDrag on existing block via stage handler")}catch(i){console.warn("⚠️ Unable to force startDrag from stage handler:",i)}return}this.isCreatingBlock=!0,this.blockCreationStart={x:t.x,y:t.y},this.previewBlock=new Konva.Rect({x:t.x,y:t.y,width:0,height:0,fill:"rgba(0, 123, 255, 0.3)",stroke:"#007bff",strokeWidth:2,dash:[5,5],opacity:.7}),this.blocksLayer.add(this.previewBlock),this.stage.batchDraw(),console.log("🎯 Block creation started at:",t.x,t.y)}}handleBlockCreationMove(e){if(!this.isCreatingBlock||!this.previewBlock)return;const t=this.stage.getPointerPosition();if(!t)return;const o=Math.abs(t.x-this.blockCreationStart.x),i=Math.abs(t.y-this.blockCreationStart.y),s=20,n=Math.max(o,s),a=Math.max(i,s);this.previewBlock.x(Math.min(t.x,this.blockCreationStart.x)),this.previewBlock.y(Math.min(t.y,this.blockCreationStart.y)),this.previewBlock.width(n),this.previewBlock.height(a),this.stage.batchDraw()}handleBlockCreationEnd(e){if(!this.isCreatingBlock||!this.previewBlock)return;const t=this.stage.getPointerPosition();if(!t)return;const o=Math.abs(t.x-this.blockCreationStart.x),i=Math.abs(t.y-this.blockCreationStart.y),s=20,n=Math.max(o,s),a=Math.max(i,s),r=Math.min(t.x,this.blockCreationStart.x),l=Math.min(t.y,this.blockCreationStart.y);this.previewBlock.destroy(),this.previewBlock=null,this.createBlock(r+n/2,l+a/2,n,a),this.isCreatingBlock=!1,this.blockCreationStart=null,this.stage.batchDraw(),console.log("✅ Block created with dimensions:",n,"x",a)}findBlockAtPosition(e,t){for(let o=this.blocks.length-1;o>=0;o--){const i=this.blocks[o];if(e>=i.x&&e<=i.x+i.width&&t>=i.y&&t<=i.y+i.height)return i}return null}getNextBlockId(){const e=new Set(this.blocks.map(o=>o.id));let t=1;for(;e.has(t);)t++;return t}createBlock(e,t,o=50,i=50){const s=this.getNextBlockId(),n=new Konva.Group({x:e-o/2,y:t-i/2,draggable:!0,id:`blockGroup-${s}`,data:{blockId:s,type:"block"},name:"block-group",listening:!0,dragDistance:0}),a=new Konva.Rect({x:0,y:0,width:o,height:i,fill:"rgba(0, 123, 255, 0.15)",stroke:"#007bff",strokeWidth:2,id:`block-${s}`,data:{blockId:s,type:"block"},cornerRadius:6,shadowColor:"rgba(0, 123, 255, 0.3)",shadowBlur:10,shadowOffset:{x:0,y:2},shadowOpacity:.5,listening:!0}),r=new Konva.Label({x:0,y:-28}),l=new Konva.Tag({fill:"#007bff",cornerRadius:4,shadowColor:"rgba(0,0,0,0.3)",shadowBlur:4,shadowOffset:{x:0,y:1}}),d=new Konva.Text({text:s.toString(),fontSize:16,fontFamily:"Arial, sans-serif",fontStyle:"bold",fill:"white",padding:6});r.add(l),r.add(d),n.add(a),n.add(r),console.log("🔧 Created block group draggable:",n.draggable()),console.log("🔧 Group position:",{x:n.x(),y:n.y()}),console.log("🧭 Block created debug:",{blockId:s,groupId:n.id(),rectId:a.id(),groupDraggable:n.draggable(),rectDraggable:a.draggable(),groupListening:n.listening(),rectListening:a.listening(),absPos:n.getAbsolutePosition()}),this.addBlockEvents(n,s,a),this.blocksLayer.add(n),this.animateBlockAppearance(a,r),this.stage.batchDraw(),this.blocks.push({id:s,group:n,rect:a,x:n.x(),y:n.y(),width:o,height:i}),this.words.find(u=>u.blockId===s)||this.words.push({blockId:s,word:""}),this.updateWordsEditor()}animateBlockAppearance(e,t){e.opacity(0),t.opacity(0);const o=new Konva.Animation(i=>{const s=i.time/200;s>=1?(o.stop(),e.opacity(1),t.opacity(1)):(e.opacity(s),t.opacity(s)),this.stage.batchDraw()});o.start()}addResizeHandles(e,t){console.log("🔧 Resize handles disabled - using edge detection instead")}updateHandlePositions(e,t,o){const i=e.findOne("Text");i&&(i.x(-8),i.y(-28))}addBlockEvents(e,t,o){console.log("🔗 Adding events to block:",t),console.log("🔗 Block draggable states:",{group:e.draggable(),rect:o.draggable()}),console.log("🔗 Initial positions:",{group:{x:e.x(),y:e.y()},rect:{x:o.x(),y:o.y()}}),e.on("click",i=>{console.log("🖱️ Block clicked:",t),console.log("🖱️ Click event target:",i.target),console.log("🖱️ Group draggable state:",e.draggable()),i.cancelBubble=!0,i.evt&&(i.evt.cancelBubble=!0),this.selectShape(e)}),e.on("dragstart",i=>{console.log("🔧 Block drag started:",t),console.log("🔧 Group draggable state:",e.draggable()),console.log("🔧 Drag event target:",i.target);try{console.log("🧭 dragstart debug:",{pointer:this.stage.getPointerPosition(),groupPos:{x:e.x(),y:e.y()},absPos:e.getAbsolutePosition(),isDragging:e.isDragging()})}catch{}o.shadowBlur(20),o.shadowOffset({x:0,y:4}),o.stroke("#28a745"),o.strokeWidth(3),this.stage.batchDraw()}),e.on("mousedown touchstart",i=>{try{console.log("🧪 group mousedown/touchstart:",{blockId:t,targetClass:i.target&&i.target.getClassName&&i.target.getClassName(),pointer:this.stage.getPointerPosition(),groupDraggable:e.draggable(),isDraggingBefore:e.isDragging(),buttons:i.evt&&i.evt.buttons})}catch{}i.cancelBubble=!0,i.evt&&(i.evt.cancelBubble=!0);try{e.startDrag(),console.log("✅ group.startDrag() called")}catch(s){console.warn("⚠️ group.startDrag error:",s)}}),o.on("mousedown touchstart",i=>{try{console.log("🧪 rect mousedown/touchstart:",{blockId:t,targetClass:i.target&&i.target.getClassName&&i.target.getClassName(),pointer:this.stage.getPointerPosition(),groupDraggable:e.draggable(),isDraggingBefore:e.isDragging(),buttons:i.evt&&i.evt.buttons})}catch{}i.cancelBubble=!0,i.evt&&(i.evt.cancelBubble=!0);try{e.startDrag(),console.log("✅ group.startDrag() called from rect")}catch(s){console.warn("⚠️ group.startDrag error (rect):",s)}}),e.on("dragmove",i=>{try{console.log("🔧 Block drag move:",t,{groupPos:{x:e.x(),y:e.y()},rectLocalPos:{x:o.x(),y:o.y()},absPos:e.getAbsolutePosition(),pointer:this.stage.getPointerPosition()})}catch{}const s=this.blocks.find(n=>n.id===t);s&&(s.x=e.x(),s.y=e.y(),console.log("📊 Block position updated:",{id:t,x:s.x,y:s.y})),this.stage.batchDraw()}),e.on("dragend",i=>{console.log("🔧 Block drag ended:",t),console.log("🔧 Final position:",{x:e.x(),y:e.y()});try{console.log("🧭 dragend debug:",{absPos:e.getAbsolutePosition(),pointer:this.stage.getPointerPosition(),isDraggingAfter:e.isDragging()})}catch{}o.shadowBlur(10),o.shadowOffset({x:0,y:2}),o.stroke("#007bff"),o.strokeWidth(2),this.stage.batchDraw()}),e.on("contextmenu",i=>{i.evt.preventDefault(),confirm("Delete this block?")&&this.deleteBlock(t)}),e.on("mouseenter",()=>{this.selectedShape!==e&&(o.stroke("#0056b3"),o.strokeWidth(3),this.stage.batchDraw())}),e.on("mouseleave",()=>{this.selectedShape!==e&&(o.stroke("#007bff"),o.strokeWidth(2),this.stage.batchDraw())}),console.log("✅ Block events added for block:",t)}selectShape(e){if(console.log("🎯 Selecting shape:",e),this.deselectAll(),this.selectedShape=e,e.findOne("Rect")){const t=e.findOne("Rect");t.stroke("#28a745"),t.strokeWidth(3),t.shadowBlur(20),t.shadowOffset({x:0,y:4}),console.log("✅ Block selected and highlighted"),this.showDeleteBlockButton()}else if(e.findOne("Line")){const t=e.findOne("Line");t.stroke("#28a745"),t.strokeWidth(4),t.shadowBlur(15),t.shadowOffset({x:0,y:2}),console.log("✅ Arrow selected and highlighted"),this.showDeleteArrowButton()}this.stage.batchDraw()}deselectAll(){if(this.selectedShape){if(this.selectedShape.findOne("Rect")){const e=this.selectedShape.findOne("Rect");e.stroke("#007bff"),e.strokeWidth(2),e.shadowBlur(10),e.shadowOffset({x:0,y:2})}else if(this.selectedShape.findOne("Line")){const e=this.selectedShape.findOne("Line");e.stroke("#6c757d"),e.strokeWidth(2),e.shadowBlur(0),e.shadowOffset({x:0,y:0})}this.selectedShape=null}this.hideDeleteButtons(),this.stage.batchDraw()}showDeleteBlockButton(){const e=document.getElementById("deleteBlockBtn"),t=document.getElementById("deleteArrowBtn");e&&(e.style.display="inline-block"),t&&(t.style.display="none")}showDeleteArrowButton(){const e=document.getElementById("deleteBlockBtn"),t=document.getElementById("deleteArrowBtn");e&&(e.style.display="none"),t&&(t.style.display="inline-block")}hideDeleteButtons(){const e=document.getElementById("deleteBlockBtn"),t=document.getElementById("deleteArrowBtn");e&&(e.style.display="none"),t&&(t.style.display="none")}deleteBlock(e){const t=this.blocks.findIndex(o=>o.id===e);if(t!==-1){const o=this.blocks[t];o.group.destroy(),this.blocks.splice(t,1),this.words=this.words.filter(l=>l.blockId!==e);const i=o.x,s=o.y,n=o.width,a=o.height,r=(l,d)=>l>=i&&l<=i+n&&d>=s&&d<=s+a;for(let l=this.arrows.length-1;l>=0;l--){const d=this.arrows[l];(r(d.start_x,d.start_y)||r(d.end_x,d.end_y))&&(d.group&&typeof d.group.destroy=="function"&&d.group.destroy(),this.arrows.splice(l,1))}this.updateWordsEditor(),this.stage.batchDraw()}}handleArrowMouseDown(e){if(this.isDrawingArrow){const t=this.stage.getPointerPosition();if(!t)return;console.log("🎯 Arrow drawing started at:",t.x,t.y),this.currentArrow=new Konva.Arrow({points:[t.x,t.y,t.x,t.y],pointerLength:10,pointerWidth:10,fill:"#dc3545",stroke:"#dc3545",strokeWidth:3,id:`arrow-${++this.currentArrowId}`,data:{arrowId:this.currentArrowId,type:"arrow"}}),this.arrowsLayer.add(this.currentArrow),this.stage.batchDraw()}}handleArrowMouseMove(e){if(this.isDrawingArrow&&this.currentArrow){const t=this.stage.getPointerPosition();if(!t)return;const o=this.currentArrow.points();this.currentArrow.points([o[0],o[1],t.x,t.y]),this.stage.batchDraw()}}handleArrowMouseUp(e){if(this.isDrawingArrow&&this.currentArrow){const t=this.stage.getPointerPosition();if(!t)return;console.log("✅ Arrow drawing completed at:",t.x,t.y);const o=this.currentArrow.points();this.currentArrow.destroy(),this.createArrow(o[0],o[1],t.x,t.y),this.currentArrow=null,this.isDrawingArrow=!1}}handleArrowClick(e,t){this.arrowStart?(this.createArrow(this.arrowStart.x,this.arrowStart.y,e,t),this.arrowStart=null,this.stopArrowPreview(),this.enableBlockMode()):(this.arrowStart={x:e,y:t},this.startArrowPreview())}startArrowPreview(){console.log("🎯 Starting arrow preview");const e=o=>{if(!this.arrowStart)return;const i=this.stage.getPointerPosition();i&&this.updateArrowPreview(i.x,i.y)},t=o=>{if(!this.arrowStart)return;const i=this.stage.getPointerPosition();i&&(console.log("🎯 Arrow preview ended, creating arrow from",this.arrowStart,"to",i),this.createArrow(this.arrowStart.x,this.arrowStart.y,i.x,i.y),this.arrowStart=null,this.stopArrowPreview(),this.enableBlockMode(),this.stage.off("mousemove",e),this.stage.off("mouseup",t))};this.stage.on("mousemove",e),this.stage.on("mouseup",t)}stopArrowPreview(){this.removeArrowPreview()}updateArrowPreview(e,t){if(this.removeArrowPreview(),!this.arrowStart)return;const o=new Konva.Line({points:[this.arrowStart.x,this.arrowStart.y,e,t],stroke:"#dc3545",strokeWidth:3,dash:[5,5],opacity:.6});this.arrowsLayer.add(o),this.stage.batchDraw(),this.previewArrow=o}removeArrowPreview(){this.previewArrow&&(this.previewArrow.destroy(),this.previewArrow=null,this.stage.batchDraw())}createArrow(e,t,o,i){const s=++this.currentArrowId;console.log("➡️ Creating arrow:",{startX:e,startY:t,endX:o,endY:i});const n=this.snapToNearestBlock(e,t),a=n?n.x:e,r=n?n.y:t,l=o,d=i;if(!this.validateArrowPlacement(a,r,l,d)){console.log(`❌ Arrow ${s} validation failed - cancelling creation`);return}let u=null,p="none";if(n&&(u=n.blockId,p="start"),!u){console.log("❌ Arrow not associated with any block - cancelling creation"),this.showNoBlockWarning();return}console.log(`🎯 Arrow ${s} associated with block ${u} (${p})`);const f=new Konva.Line({points:[a,r,l,d],stroke:"#dc3545",strokeWidth:3,id:`arrow-${s}`,data:{arrowId:s,type:"arrow"}}),x=new Konva.RegularPolygon({x:l,y:d,sides:3,radius:8,fill:"#dc3545",rotation:Math.atan2(d-r,l-a)*180/Math.PI+90}),m=new Konva.Group({id:`arrowGroup-${s}`,data:{arrowId:s,type:"arrow"}});if(m.add(f),m.add(x),m.on("click",()=>{this.selectShape(m)}),m.on("contextmenu",w=>{w.evt.preventDefault(),confirm("Delete this arrow?")&&this.deleteArrow(s)}),this.arrowsLayer.add(m),m.on("click",()=>{console.log("🖱️ Arrow clicked:",s),this.selectShape(m)}),this.stage.batchDraw(),this.arrows.push({id:s,group:m,line:f,start_x:this.convertToOriginalCoordinates(a,r).x,start_y:this.convertToOriginalCoordinates(a,r).y,end_x:this.convertToOriginalCoordinates(l,d).x,end_y:this.convertToOriginalCoordinates(l,d).y,associated_block_id:u,association_type:p}),u){const w=this.blocks.find(b=>b.id===u);if(w){const b=new Konva.Circle({x:w.x+w.width+5,y:w.y+5,radius:4,fill:"#dc3545",stroke:"white",strokeWidth:1,id:`arrow-indicator-${s}`});this.blocksLayer.add(b),this.stage.batchDraw(),this.arrows[this.arrows.length-1].indicator=b}}console.log("✅ Arrow created and stored:",this.arrows[this.arrows.length-1])}isPointNearBlock(e,t,o,i=60){return e>=o.x-i&&e<=o.x+o.width+i&&t>=o.y-i&&t<=o.y+o.height+i}convertToOriginalCoordinates(e,t){const o=(e-this.imageInfo.x)/this.imageInfo.scale,i=(t-this.imageInfo.y)/this.imageInfo.scale;return{x:o,y:i}}snapToNearestBlock(e,t,o=60){let i=null,s=1/0,n=null;for(const a of this.blocks){const r=a.x+a.width/2,l=a.y+a.height/2,d=Math.sqrt(Math.pow(e-r,2)+Math.pow(t-l,2));d<=o&&d<s&&(s=d,i=a,n={x:r,y:l,blockId:i.id,block:i,distance:s})}return n&&console.log(`🧲 Snapping to block ${i.id} at (${n.x}, ${n.y})`),n}validateArrowPlacement(e,t,o,i){let s=!1;for(const n of this.blocks)if(this.isPointNearBlock(e,t,n)){s=!0;break}return s?!0:(console.log("❌ Arrow start point not near any block - cancelling creation"),this.showNoBlockWarning(),!1)}showNoBlockWarning(){const e=document.createElement("div");if(e.style.cssText=`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);
        animation: warningFade 2s ease-in-out;
      `,e.textContent="⚠️ Arrow must start or end near a block",!document.getElementById("warningStyles")){const t=document.createElement("style");t.id="warningStyles",t.textContent=`
          @keyframes warningFade {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          }
        `,document.head.appendChild(t)}document.body.appendChild(e),setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},2e3)}deleteArrow(e){const t=this.arrows.findIndex(o=>o.id===e);if(t!==-1){const o=this.arrows[t];o.indicator&&o.indicator.destroy(),o.group.destroy(),this.arrows.splice(t,1),this.stage.batchDraw()}}createWordsEditor(){console.log("📝 Creating words editor...");const e=this.container.querySelector("#wordsEditor"),t=this.container.querySelector("#actionButtonsContainer");e?(e.style.display="block",console.log("✅ Words editor displayed")):console.error("❌ Words editor not found!"),t?(t.style.display="block",console.log("✅ Action buttons container displayed")):console.error("❌ Action buttons container not found!"),this.updateWordsEditor()}updateWordsEditor(){console.log("📝 Updating words editor...");const e=this.container.querySelector("#wordsList");if(!e){console.error("❌ Words list element not found!");return}console.log("📊 Current blocks for words:",this.blocks.length);const t=e.querySelectorAll(".word-input");t&&t.length&&t.forEach(o=>{const i=o.getAttribute("data-block-id"),s=i?parseInt(i):null;if(!s)return;const n=o.value||"",a=this.words.findIndex(r=>r.blockId===s);a>=0?this.words[a].word=n:n&&n.trim()!==""&&this.words.push({blockId:s,word:n})}),e.innerHTML="",this.blocks.forEach((o,i)=>{console.log(`📝 Creating word input for block ${o.id}`);const s=document.createElement("div");s.className="word-item",s.innerHTML=`
          <div class="word-number">${o.id}</div>
          <input type="text" class="word-input" placeholder="Enter word for block ${o.id}" 
                 data-block-id="${o.id}">
        `;const n=s.querySelector(".word-input"),a=this.words.find(r=>r.blockId===o.id);a&&(n.value=a.word||""),n.addEventListener("input",r=>{const l=parseInt(r.target.dataset.blockId),d=r.target.value;console.log(`📝 Word updated for block ${l}: "${d}"`),this.updateWord(l,d)}),e.appendChild(s)}),console.log("✅ Words editor updated successfully")}updateWord(e,t){console.log(`📝 Updating word for block ${e}: "${t}"`);const o=this.words.findIndex(i=>i.blockId===e);o>=0?(this.words[o].word=t,console.log(`✅ Updated existing word at index ${o}`)):(this.words.push({blockId:e,word:t}),console.log(`✅ Added new word for block ${e}`)),console.log("📊 Current words array:",this.words)}clearAll(){console.log("🗑️ Clear all method called"),this.blocksLayer.destroyChildren(),this.arrowsLayer.destroyChildren(),console.log("✅ Konva layers cleared"),this.blocks=[],this.arrows=[],this.words=[],console.log("✅ Arrays cleared"),this.currentBlockId=0,this.currentArrowId=0,console.log("✅ IDs reset"),this.updateWordsEditor(),this.stage.batchDraw(),console.log("✅ Stage redrawn"),console.log("✅ Clear all completed")}async saveTest(){console.log("💾 Save test method called"),console.log("📊 Current blocks:",this.blocks.length),console.log("📝 Current words:",this.words.length);for(const o of this.blocks){const i=this.words.find(s=>s.blockId===o.id);if(!i||!i.word||!i.word.trim()){console.error("❌ Validation failed: Missing word for block",o.id),alert(`Please enter a word for block ${o.id} before saving.`);return}}console.log("✅ Validation passed, preparing test data...");const e={image_url:this.image,num_blocks:this.blocks.length,questions:this.blocks.map(o=>{var n,a,r,l,d,u,p;const i={question_id:o.id,word:((n=this.words.find(f=>f.blockId===o.id))==null?void 0:n.word)||"",block_coordinates:{x:o.x,y:o.y,width:o.width,height:o.height,rel_x:this.originalImageWidth?(o.x-this.imageInfo.x)/this.imageInfo.scale/this.originalImageWidth*100:null,rel_y:this.originalImageHeight?(o.y-this.imageInfo.y)/this.imageInfo.scale/this.originalImageHeight*100:null,rel_width:this.originalImageWidth?o.width/this.imageInfo.scale/this.originalImageWidth*100:null,rel_height:this.originalImageHeight?o.height/this.imageInfo.scale/this.originalImageHeight*100:null,image_width:this.originalImageWidth||null,image_height:this.originalImageHeight||null},has_arrow:!1},s=this.arrows.filter(f=>f.associated_block_id===o.id);if(s.length>0){i.has_arrow=!0;const f=s[0];i.arrow={start_x:f.start_x,start_y:f.start_y,end_x:f.end_x,end_y:f.end_y,rel_start_x:this.originalImageWidth||(a=this.imageInfo)!=null&&a.originalWidth?f.start_x/(this.originalImageWidth||this.imageInfo.originalWidth)*100:null,rel_start_y:this.originalImageHeight||(r=this.imageInfo)!=null&&r.originalHeight?f.start_y/(this.originalImageHeight||this.imageInfo.originalHeight)*100:null,rel_end_x:this.originalImageWidth||(l=this.imageInfo)!=null&&l.originalWidth?f.end_x/(this.originalImageWidth||this.imageInfo.originalWidth)*100:null,rel_end_y:this.originalImageHeight||(d=this.imageInfo)!=null&&d.originalHeight?f.end_y/(this.originalImageHeight||this.imageInfo.originalHeight)*100:null,image_width:this.originalImageWidth||((u=this.imageInfo)==null?void 0:u.originalWidth)||null,image_height:this.originalImageHeight||((p=this.imageInfo)==null?void 0:p.originalHeight)||null,style:{color:"#dc3545",thickness:3}},console.log(`🎯 Block ${o.id} has ${s.length} associated arrows`)}return i}),arrows:this.arrows.map(o=>{var i,s,n,a,r,l;return{start_x:o.start_x,start_y:o.start_y,end_x:o.end_x,end_y:o.end_y,rel_start_x:this.originalImageWidth||(i=this.imageInfo)!=null&&i.originalWidth?o.start_x/(this.originalImageWidth||this.imageInfo.originalWidth)*100:null,rel_start_y:this.originalImageHeight||(s=this.imageInfo)!=null&&s.originalHeight?o.start_y/(this.originalImageHeight||this.imageInfo.originalHeight)*100:null,rel_end_x:this.originalImageWidth||(n=this.imageInfo)!=null&&n.originalWidth?o.end_x/(this.originalImageWidth||this.imageInfo.originalWidth)*100:null,rel_end_y:this.originalImageHeight||(a=this.imageInfo)!=null&&a.originalHeight?o.end_y/(this.originalImageHeight||this.imageInfo.originalHeight)*100:null,image_width:this.originalImageWidth||((r=this.imageInfo)==null?void 0:r.originalWidth)||null,image_height:this.originalImageHeight||((l=this.imageInfo)==null?void 0:l.originalHeight)||null,arrow_style:{color:"#dc3545",thickness:3}}})};console.log("📊 Test data prepared:",e);const t=new CustomEvent("matchingTestSaved",{detail:e});this.container.dispatchEvent(t),console.log("📡 Custom event dispatched: matchingTestSaved"),alert("Test data prepared! Check the console for the test data structure."),console.log("Matching test data:",e)}async createTest(){this.updateCreateTestButtonState("loading"),this.showTestCreationLoadingOverlay(),this.updateLoadingStep("Preparing test data...",25);const e=`Matching Test — ${new Date().toLocaleString()}`,t=typeof document<"u"?document.getElementById("matchingTestName"):null,o=t&&t.value&&t.value.trim()?t.value.trim():e,i=await getCurrentTeacherId();if(!i){console.error("No valid teacher session found in createTest, redirecting to login"),alert("Missing teacher session. Please sign in again."),typeof showSection=="function"?showSection("login-section"):window.location.href="index.html";return}const s=this.blocks.map(r=>{var p,f,x,m,w,b,v;const l=((p=this.words.find(y=>y.blockId===r.id))==null?void 0:p.word)||"",d={question_id:r.id,word:l,block_coordinates:{x:r.x,y:r.y,width:r.width,height:r.height,rel_x:this.originalImageWidth?(r.x-this.imageInfo.x)/this.imageInfo.scale/this.originalImageWidth*100:null,rel_y:this.originalImageHeight?(r.y-this.imageInfo.y)/this.imageInfo.scale/this.originalImageHeight*100:null,rel_width:this.originalImageWidth?r.width/this.imageInfo.scale/this.originalImageWidth*100:null,rel_height:this.originalImageHeight?r.height/this.imageInfo.scale/this.originalImageHeight*100:null,image_width:this.originalImageWidth||null,image_height:this.originalImageHeight||null},has_arrow:!1},u=this.arrows.filter(y=>y.associated_block_id===r.id);if(u.length>0){d.has_arrow=!0;const y=u[0];d.arrow={start_x:y.start_x,start_y:y.start_y,end_x:y.end_x,end_y:y.end_y,rel_start_x:this.originalImageWidth||(f=this.imageInfo)!=null&&f.originalWidth?y.start_x/(this.originalImageWidth||this.imageInfo.originalWidth)*100:null,rel_start_y:this.originalImageHeight||(x=this.imageInfo)!=null&&x.originalHeight?y.start_y/(this.originalImageHeight||this.imageInfo.originalHeight)*100:null,rel_end_x:this.originalImageWidth||(m=this.imageInfo)!=null&&m.originalWidth?y.end_x/(this.originalImageWidth||this.imageInfo.originalWidth)*100:null,rel_end_y:this.originalImageHeight||(w=this.imageInfo)!=null&&w.originalHeight?y.end_y/(this.originalImageHeight||this.imageInfo.originalHeight)*100:null,image_width:this.originalImageWidth||((b=this.imageInfo)==null?void 0:b.originalWidth)||null,image_height:this.originalImageHeight||((v=this.imageInfo)==null?void 0:v.originalHeight)||null,style:{color:"#dc3545",thickness:3}},console.log(`🎯 Block ${r.id} has ${u.length} associated arrows`)}return d}),n={teacher_id:i,test_name:o,image_url:this.image,num_blocks:this.blocks.length,questions:s};console.log("📦 Sending matching test payload:",n),(async()=>(this.image&&typeof this.image=="string"&&(n.image_url=this.image,console.log("✅ Using Cloudinary URL for test:",this.image)),!0))().then(r=>{r&&(this.updateLoadingStep("Saving test to database...",50),window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/save-matching-type-test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}).then(async l=>{const d=await l.json().catch(()=>({}));if(!l.ok||!d.success){console.error("❌ Save matching test failed:",l.status,d),alert("Failed to save matching test."),this.updateCreateTestButtonState("reset"),this.hideTestCreationLoadingOverlay();return}console.log("✅ Matching test saved, id:",d.test_id),this.updateLoadingStep("Test created successfully! Loading assignment interface...",100),this.updateCreateTestButtonState("success"),setTimeout(()=>{typeof window.clearTestLocalStorage=="function"&&window.clearTestLocalStorage(),this.hideTestCreationUI(),showTestAssignment("matching_type",d.test_id)},1e3)}).catch(l=>{console.error("❌ Error saving matching test:",l),alert("Error saving matching test. Please try again."),this.updateCreateTestButtonState("reset"),this.hideTestCreationLoadingOverlay()}))})}hideTestCreationUI(){console.log("🔒 Hiding test creation UI...");const e=this.container.querySelector(".matching-test-creation");e&&(e.style.display="none");const t=this.container.querySelector(".matching-test-canvas-container");t&&(t.style.display="none");const o=this.container.querySelector(".matching-test-words-panel");o&&(o.style.display="none");const i=this.container.querySelector("#createTestBtn");i&&(i.style.display="none"),console.log("✅ Test creation UI hidden")}cancelTestCreation(){if(console.log("❌ Cancel test creation called"),!this.image)try{if(typeof window.resetTestCreation=="function"){window.resetTestCreation(),console.log("✅ No image uploaded — exited test creation and returned to main page");return}}catch{}if(confirm("Are you sure you want to cancel test creation? All progress will be lost.")){console.log("✅ User confirmed cancellation"),this.clearAll();const e=this.container.querySelector("#imageEditor"),t=this.container.querySelector("#wordsEditor"),o=this.container.querySelector("#actionButtonsContainer");e&&(e.style.display="none",console.log("✅ Image editor hidden")),t&&(t.style.display="none",console.log("✅ Words editor hidden")),o&&(o.style.display="none",console.log("✅ Action buttons hidden"));const i=this.container.querySelector("#imageUploader");i&&(i.style.display="block",console.log("✅ Image uploader shown")),this.image=null,this.imageInfo=null,this.imageLayer&&(this.imageLayer.destroyChildren(),this.stage.batchDraw(),console.log("✅ Image layer cleared"));const s=this.container.querySelector("#uploadStatus");s&&(s.style.display="none",console.log("✅ Upload status hidden")),console.log("✅ Test creation cancelled - widget reset to initial state")}else console.log("❌ User cancelled the cancellation")}hideLoadingIndicator(){const e=this.container.querySelector("#loadingIndicator"),t=this.container.querySelector("#imageUploader");e&&(e.style.display="none"),t&&(t.style.display="block")}showError(e){const t=document.createElement("div");t.style.cssText=`
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
      `,t.innerHTML=`
        <div style="margin-bottom: 15px;">
          <span style="font-size: 24px;">⚠️</span>
          <h4 style="margin: 10px 0;">Graphics Library Error</h4>
          <p style="margin: 0; font-weight: normal;">${e}</p>
        </div>
        <button onclick="location.reload()" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        ">🔄 Retry</button>
      `;const o=this.container.querySelector("#loadingIndicator");o&&(o.style.display="none"),this.container.appendChild(t)}debugState(){var e,t,o,i,s;console.log("🔍 === WIDGET DEBUG STATE ==="),console.log("📋 Container:",this.container),console.log("🖼️ Image:",this.image),console.log("📊 Blocks count:",this.blocks.length),console.log("📝 Words count:",this.words.length),console.log("➡️ Arrows count:",this.arrows.length),console.log("🎨 Stage:",this.stage),console.log("🔢 Current block ID:",this.currentBlockId),console.log("🔢 Current arrow ID:",this.currentArrowId),console.log("🎯 Selected shape:",this.selectedShape),console.log("📱 Elements visibility:"),console.log("  - Loading indicator:",(e=this.container.querySelector("#loadingIndicator"))==null?void 0:e.style.display),console.log("  - Image uploader:",(t=this.container.querySelector("#imageUploader"))==null?void 0:t.style.display),console.log("  - Image editor:",(o=this.container.querySelector("#imageEditor"))==null?void 0:o.style.display),console.log("  - Words editor:",(i=this.container.querySelector("#wordsEditor"))==null?void 0:i.style.display),console.log("  - Action buttons:",(s=this.container.querySelector("#actionButtonsContainer"))==null?void 0:s.style.display),console.log("🔍 === END DEBUG STATE ===")}testWidget(){console.log("🧪 === TESTING WIDGET FUNCTIONALITY ==="),typeof Konva<"u"?console.log("✅ Konva.js is loaded"):console.error("❌ Konva.js is NOT loaded"),this.stage?console.log("✅ Konva stage exists"):console.error("❌ Konva stage does NOT exist"),this.blocksLayer&&this.arrowsLayer?console.log("✅ Konva layers exist"):console.error("❌ Konva layers do NOT exist");const e=this.container.querySelector("#addBlockBtn"),t=this.container.querySelector("#createTestBtn"),o=this.container.querySelector("#cancelTestCreationMatching");if(e?(console.log("✅ Add block button exists"),console.log("  - Display:",e.style.display),console.log("  - Visible:",e.offsetParent!==null)):console.error("❌ Add block button does NOT exist"),t?(console.log("✅ Create test button exists"),console.log("  - Display:",t.style.display),console.log("  - Visible:",t.offsetParent!==null)):console.error("❌ Create test button does NOT exist"),o?(console.log("✅ Cancel button exists"),console.log("  - Display:",o.style.display),console.log("  - Visible:",o.offsetParent!==null)):console.error("❌ Cancel button does NOT exist"),console.log("📊 Current widget state:"),console.log("  - Blocks:",this.blocks.length),console.log("  - Arrows:",this.arrows.length),console.log("  - Words:",this.words.length),console.log("  - Image:",this.image?"Loaded":"Not loaded"),this.blocks.length>0){const i=this.blocks[0];if(console.log("🔧 Testing block dragging:"),console.log("  - Block group:",i.group),console.log("  - Group draggable:",i.group.draggable()),console.log("  - Group position:",{x:i.group.x(),y:i.group.y()}),console.log("  - Rect position:",{x:i.rect.x(),y:i.rect.y()}),console.log("🔧 Testing resize functionality:"),console.log("  - Selected shape:",this.selectedShape),console.log("  - Resize direction:",this.resizeDir),console.log("  - Resizing flag:",this.resizing),console.log("  - Start position:",this.startPos),console.log("  - Start rect:",this.startRect),this.selectedShape){const s={x:i.x+5,y:i.y+5};console.log("🔧 Testing edge detection with position:",s),this.handleEdgeDetection(s),console.log("🔧 After edge detection - resizeDir:",this.resizeDir)}}console.log("🧪 === END TESTING ===")}testKonvaBasics(){if(console.log("🧪 Testing basic Konva functionality..."),!this.stage)return console.error("❌ Stage not initialized"),!1;if(!this.blocksLayer)return console.error("❌ Blocks layer not initialized"),!1;console.log("🔧 Creating test rectangle...");const e=new Konva.Rect({x:50,y:50,width:100,height:80,fill:"rgba(0, 255, 0, 0.3)",stroke:"green",strokeWidth:2,draggable:!0});return e.on("dragstart",()=>console.log("✅ Test rect drag started")),e.on("dragmove",()=>console.log("✅ Test rect drag move")),e.on("dragend",()=>console.log("✅ Test rect drag ended")),this.blocksLayer.add(e),this.stage.batchDraw(),console.log("✅ Test rectangle created and added"),console.log("✅ Basic Konva functionality test passed"),!0}deleteSelectedBlock(){if(!this.selectedShape){console.log("❌ No block selected for deletion");return}const e=this.blocks.find(o=>o.group===this.selectedShape);if(!e){console.log("❌ Block data not found for selected shape");return}console.log("🗑️ Deleting block:",e.id),this.selectedShape.destroy();const t=this.blocks.findIndex(o=>o.id===e.id);t!==-1&&this.blocks.splice(t,1),this.selectedShape=null,this.updateWordsEditor(),this.stage.batchDraw(),console.log("✅ Block deleted successfully")}deleteSelectedArrow(){if(!this.selectedShape){console.log("❌ No arrow selected for deletion");return}const e=this.arrows.find(o=>o.group===this.selectedShape);if(!e){console.log("❌ Arrow data not found for selected shape");return}console.log("🗑️ Deleting arrow:",e.id),this.selectedShape.destroy();const t=this.arrows.findIndex(o=>o.id===e.id);t!==-1&&this.arrows.splice(t,1),this.selectedShape=null,this.stage.batchDraw(),console.log("✅ Arrow deleted successfully")}cleanup(){this.documentMouseMoveHandler&&(document.removeEventListener("mousemove",this.documentMouseMoveHandler),this.documentMouseMoveHandler=null),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),this.stage&&(this.stage.destroy(),this.stage=null)}resetImage(){console.log("🔄 Resetting image and clearing all content"),this.clearAll();const e=document.getElementById("imageEditor");e&&(e.style.display="none");const t=document.getElementById("imageUploader");t&&(t.style.display="block");const o=document.getElementById("wordsEditor"),i=document.getElementById("actionButtonsContainer");o&&(o.style.display="none"),i&&(i.style.display="none");const s=document.getElementById("uploadedImage");s&&(s.src="",s.style.display="none"),this.imageUrl=null,console.log("✅ Image reset complete")}updateCreateTestButtonState(e){const t=this.container.querySelector("#createTestBtn");if(t)switch(e){case"loading":t.textContent="Creating Test...",t.disabled=!0,t.classList.remove("btn-success"),t.classList.add("btn-secondary");break;case"success":t.textContent="Test Created!",t.disabled=!0,t.classList.remove("btn-secondary"),t.classList.add("btn-success");break;case"reset":t.textContent="Create Test",t.disabled=!1,t.classList.remove("btn-secondary"),t.classList.add("btn-success");break}}showTestCreationLoadingOverlay(){let e=this.container.querySelector("#testCreationLoadingOverlay");e||(e=document.createElement("div"),e.id="testCreationLoadingOverlay",e.className="test-creation-loading-overlay",e.innerHTML=`
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <h3>Creating Your Test</h3>
            <p id="loadingStep">Preparing test data...</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        `,this.container.appendChild(e)),e.style.display="flex"}hideTestCreationLoadingOverlay(){const e=this.container.querySelector("#testCreationLoadingOverlay");e&&(e.style.display="none")}updateLoadingStep(e,t){const o=this.container.querySelector("#loadingStep"),i=this.container.querySelector(".progress-fill");o&&(o.textContent=e),i&&(i.style.width=`${t}%`)}}window.MatchingTestWidget=c,window.debugMatchingTestWidget=function(h){const e=document.getElementById(h);e&&e._matchingTestWidget?e._matchingTestWidget.debugState():console.log("🔍 No matching test widget found in container:",h)},window.testMatchingTestWidget=function(h){const e=document.getElementById(h);e&&e._matchingTestWidget?e._matchingTestWidget.testWidget():console.log("🧪 No matching test widget found in container:",h)},typeof window.initMatchingTestWidget>"u"&&(window.initMatchingTestWidget=async function(h){const e=document.getElementById(h);if(e)try{const t=new c(e);return e._matchingTestWidget=t,console.log("🔗 Widget reference stored in container for debugging"),await new Promise(o=>{const i=setInterval(()=>{t.stage&&(clearInterval(i),o())},100)}),t}catch(t){return console.error("Failed to initialize widget:",t),null}return null})})();const U="modulepreload",$=function(g){return"/"+g},S={},k=function(c,h,e){let t=Promise.resolve();if(h&&h.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),s=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));t=Promise.allSettled(h.map(n=>{if(n=$(n),n in S)return;S[n]=!0;const a=n.endsWith(".css"),r=a?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${n}"]${r}`))return;const l=document.createElement("link");if(l.rel=a?"stylesheet":U,a||(l.as="script"),l.crossOrigin="",l.href=n,s&&l.setAttribute("nonce",s),document.head.appendChild(l),a)return new Promise((d,u)=>{l.addEventListener("load",d),l.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${n}`)))})}))}function o(i){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=i,window.dispatchEvent(s),!s.defaultPrevented)throw i}return t.then(i=>{for(const s of i||[])s.status==="rejected"&&o(s.reason);return c().catch(o)})};console.log("🚀 Main entry point loaded");document.addEventListener("DOMContentLoaded",async function(){console.log("DOM loaded, initializing application..."),E(),L(),await C()});async function C(){const g=j();console.log(`🎯 Loading module for role: ${g}`);try{switch(g){case"student":console.log("📚 Loading Student Application...");const{initializeStudentApp:c}=await k(async()=>{const{initializeStudentApp:t}=await import("./index-BzkNtf0J.js");return{initializeStudentApp:t}},__vite__mapDeps([0,1]));c();break;case"teacher":console.log("👩‍🏫 Loading Teacher Application...");const{initializeTeacherApp:h}=await k(async()=>{const{initializeTeacherApp:t}=await import("./index-CDoIlnPm.js");return{initializeTeacherApp:t}},__vite__mapDeps([2,3,1]));h();break;case"admin":console.log("👨‍💼 Loading Admin Application...");const{initializeAdminApp:e}=await k(async()=>{const{initializeAdminApp:t}=await import("./index-C0fDepW1.js");return{initializeAdminApp:t}},__vite__mapDeps([4,1]));e();break;default:console.log("🔐 No role detected, showing login screen"),I("login-section")}}catch(c){console.error("❌ Error loading role module:",c),I("login-section")}}function j(){const g=localStorage.getItem("userRole");if(g)return console.log(`Found stored role: ${g}`),g;const c=localStorage.getItem("accessToken");if(c)try{const h=JSON.parse(atob(c.split(".")[1]));return console.log(`Found role in JWT: ${h.role}`),h.role}catch{console.warn("Invalid token format, clearing token"),localStorage.removeItem("accessToken")}return console.log("No role found - user needs to login"),null}window.loadRoleBasedModule=C;console.log("✅ Main.js: Role-based loader initialized");
