// Matching Test Konva.js Widget
// Professional graphics and interactions using Konva.js

(function() {
  'use strict';

  // Load Konva.js if not already available
  function ensureKonvaLoaded() {
    return new Promise((resolve, reject) => {
      // Check for existing Konva instance with version validation
      if (typeof Konva !== 'undefined' && Konva.Stage) {
        const version = Konva.version || 'unknown';
        console.log(`✅ Konva.js already loaded (version: ${version})`);
        
        // Validate required methods exist
        const requiredMethods = ['Stage', 'Layer', 'Group', 'Rect', 'Text', 'Circle', 'Line'];
        const hasRequiredMethods = requiredMethods.every(method => typeof Konva[method] === 'function');
        
        if (hasRequiredMethods) {
          resolve();
          return;
        } else {
          console.warn('⚠️ Existing Konva instance missing required methods, reloading...');
        }
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="konva"]')) {
        console.warn('⚠️ Multiple Konva instances detected. It is not recommended to use multiple Konva instances in the same environment.');
        // Wait for existing script to load
        const checkKonva = setInterval(() => {
          if (typeof Konva !== 'undefined' && Konva.Stage) {
            clearInterval(checkKonva);
            console.log('✅ Using existing Konva instance');
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkKonva);
          reject(new Error('Timeout waiting for Konva.js to load'));
        }, 10000);
        return;
      }

      // Improved CDN Strategy - Fixed version consistency
      const cdnSources = [
        'https://unpkg.com/konva@9.2.3/konva.min.js',
        'https://cdn.jsdelivr.net/npm/konva@9.2.3/konva.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/konva/9.2.3/konva.min.js'
        // Removed @latest to prevent version conflicts
      ];

      let currentSourceIndex = 0;

      function tryNextSource() {
        if (currentSourceIndex >= cdnSources.length) {
          reject(new Error('All CDN sources failed to load Konva.js'));
          return;
        }

        const script = document.createElement('script');
        script.src = cdnSources[currentSourceIndex];
        script.onload = () => {
          // Enhanced verification with version check
          if (typeof Konva !== 'undefined' && Konva.Stage) {
            const version = Konva.version || 'unknown';
            console.log(`✅ Konva.js ${version} loaded successfully from: ${cdnSources[currentSourceIndex]}`);
            
            // Validate required methods exist
            const requiredMethods = ['Stage', 'Layer', 'Group', 'Rect', 'Text', 'Circle', 'Line'];
            const hasRequiredMethods = requiredMethods.every(method => typeof Konva[method] === 'function');
            
            if (hasRequiredMethods) {
              // Add compatibility fix for _applyMiterLimit issue
              if (Konva.Line && !Konva.Line.prototype._applyMiterLimit) {
                console.log('🔧 Applying compatibility fix for _applyMiterLimit');
                Konva.Line.prototype._applyMiterLimit = function() {
                  // Compatibility stub - this method was removed in newer versions
                  return this;
                };
              }
              resolve();
            } else {
              console.error('❌ Konva validation failed: Missing required methods');
              currentSourceIndex++;
              tryNextSource();
            }
          } else {
            console.warn(`❌ Konva.js loaded but not properly initialized from: ${cdnSources[currentSourceIndex]}`);
            currentSourceIndex++;
            tryNextSource();
          }
        };
        script.onerror = () => {
          console.warn(`❌ Failed to load Konva.js from: ${cdnSources[currentSourceIndex]}`);
          currentSourceIndex++;
          tryNextSource();
        };
        
        // Set timeout for each source (increased to 8 seconds for slower connections)
        setTimeout(() => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
            currentSourceIndex++;
            tryNextSource();
          }
        }, 8000);
        
        document.head.appendChild(script);
      }

      tryNextSource();
    });
  }

  class MatchingTestWidget {
         constructor(container) {
       this.container = container;
       this.image = null;
       this.blocks = [];
       this.words = [];
       this.arrows = [];
       this.isUploading = false;
       this.currentBlockId = 0;
       this.currentArrowId = 0;
       this.isDrawingArrow = false;
       this.arrowStart = null;
       this.selectedShape = null;
       this.stage = null;
       this.layer = null;
       this.imageLayer = null;
       this.blocksLayer = null;
       this.arrowsLayer = null;
       this.backgroundLayer = null;
       
       // Edge resizing variables
       this.resizing = false;
       this.resizeDir = null;
       this.startPos = null;
       this.startRect = null;
       
       // Arrow drawing variables
       this.currentArrow = null;
       
       this.init();
     }

    snapToGrid(value, gridSize) {
      return Math.round(value / gridSize) * gridSize;
    }

    async init() {
      console.log('🚀 Initializing MatchingTestWidget...');
      console.log('📋 Container element:', this.container);
      this.render();
      console.log('🎨 HTML rendered');
      this.bindEvents();
      console.log('🔗 Events bound');
      
      // Ensure Konva is loaded before initializing
      try {
        console.log('📦 Loading Konva.js library...');
        await ensureKonvaLoaded();
        console.log('✅ Konva.js loaded successfully');
        this.initKonva();
        this.hideLoadingIndicator();
        console.log('🎨 Konva.js initialization complete');
      } catch (error) {
        console.error('❌ Failed to load Konva.js:', error);
        this.showError('Failed to load graphics library. Please check your internet connection and try again.');
      }
    }

    render() {
      console.log('🎨 Starting render method...');
      this.container.innerHTML = `
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
      `;
      console.log('🎨 HTML rendered successfully');
      console.log('🔍 Elements found:');
      console.log('  - Loading indicator:', this.container.querySelector('#loadingIndicator'));
      console.log('  - Image uploader:', this.container.querySelector('#imageUploader'));
      console.log('  - Image editor:', this.container.querySelector('#imageEditor'));
      console.log('  - Words editor:', this.container.querySelector('#wordsEditor'));
      console.log('  - Action buttons container:', this.container.querySelector('#actionButtonsContainer'));
      console.log('  - Create test button:', this.container.querySelector('#createTestBtn'));
      console.log('  - Cancel test creation button:', this.container.querySelector('#cancelTestCreationMatching'));
    }

    bindEvents() {
      console.log('🔗 Starting bindEvents method...');
      
      const imageUploader = this.container.querySelector('#imageUploader');
      const imageFileInput = this.container.querySelector('#imageFileInput');
      // Bind events to buttons (scoped to container)
      const addBlockBtn = this.container.querySelector('#addBlockBtn');
      const addArrowBtn = this.container.querySelector('#addArrowBtn');
      const clearAllBtn = this.container.querySelector('#clearAllBtn');
      const createTestBtn = this.container.querySelector('#createTestBtn');
      const cancelTestCreationMatching = document.getElementById('cancelTestCreationMatching');
      const deleteBlockBtn = this.container.querySelector('#deleteBlockBtn');
      const deleteArrowBtn = this.container.querySelector('#deleteArrowBtn');

      if (addBlockBtn) {
        addBlockBtn.addEventListener('click', () => {
          console.log('🖱️ Add block button clicked');
          this.enableBlockMode();
        });
        console.log('✅ Add block button event bound');
      }

      if (addArrowBtn) {
        addArrowBtn.addEventListener('click', () => {
          console.log('🖱️ Add arrow button clicked');
          this.enableArrowMode();
        });
        console.log('✅ Add arrow button event bound');
      }

      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          console.log('🖱️ Clear all button clicked');
          this.clearAll();
        });
        console.log('✅ Clear all button event bound');
      }

      if (createTestBtn) {
        createTestBtn.addEventListener('click', () => {
          console.log('🖱️ Create test button clicked');
          this.createTest();
        });
        console.log('✅ Create test button event bound');
      }

      if (cancelTestCreationMatching) {
        cancelTestCreationMatching.addEventListener('click', () => {
          console.log('🖱️ Cancel test creation button clicked');
          this.cancelTestCreation();
        });
        console.log('✅ Cancel test creation button event bound');
      }

      if (deleteBlockBtn) {
        deleteBlockBtn.addEventListener('click', () => {
          console.log('🖱️ Delete block button clicked');
          this.deleteSelectedBlock();
        });
        console.log('✅ Delete block button event bound');
      }

      if (deleteArrowBtn) {
        deleteArrowBtn.addEventListener('click', () => {
          console.log('🖱️ Delete arrow button clicked');
          this.deleteSelectedArrow();
        });
        console.log('✅ Delete arrow button event bound');
      }



      // Reset image button
      const resetImageBtn = this.container.querySelector('#resetImageBtn');
      if (resetImageBtn) {
        resetImageBtn.addEventListener('click', () => {
          console.log('🖱️ Reset image button clicked');
          this.resetImage();
        });
        console.log('✅ Reset image button event bound');
      }

      // Image upload handling
      if (imageUploader) {
        imageUploader.addEventListener('click', () => {
          console.log('🖱️ Image uploader clicked');
          imageFileInput.click();
        });
      }
      
      if (imageFileInput) {
        imageFileInput.addEventListener('change', (e) => {
          console.log('📁 Image file selected:', e.target.files[0]);
          this.handleImageUpload(e);
        });
      }
      
      // Drag and drop
      if (imageUploader) {
        imageUploader.addEventListener('dragover', (e) => {
          e.preventDefault();
          imageUploader.classList.add('dragover');
        });
        
        imageUploader.addEventListener('dragleave', () => {
          imageUploader.classList.remove('dragover');
        });
        
        imageUploader.addEventListener('drop', (e) => {
          e.preventDefault();
          imageUploader.classList.remove('dragover');
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            console.log('📁 Image dropped:', files[0]);
            this.handleImageFile(files[0]);
          }
        });
      }

      // Editor controls - only enable when Konva is ready
      // These are now handled by the new button event listeners
      
      console.log('🔗 All events bound successfully');
    }

    initKonva() {
      // Get the container element
      const container = this.container.querySelector('#konvaContainer');
      if (!container) {
        console.error('❌ Konva container not found!');
        return;
      }
      
      console.log('🔧 Konva container found:', container);
      console.log('🔧 Container dimensions:', {
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
      });
      
      // Initialize Konva stage with container dimensions
      // Force layout calculation and wait for proper dimensions
      const getContainerDimensions = () => {
        // Force layout recalculation
        container.style.display = 'block';
        container.offsetHeight; // Force reflow
        
        const width = container.offsetWidth || container.clientWidth || 800;
        const height = container.offsetHeight || container.clientHeight || 600;
        
        console.log('🔧 Calculated container dimensions:', { width, height });
        return { width, height };
      };
      
      // Get initial dimensions
      let { width: containerWidth, height: containerHeight } = getContainerDimensions();
      
      // If dimensions are still 0, use reasonable defaults and try to resize later
      if (containerWidth === 0 || containerHeight === 0) {
        console.log('⚠️ Container dimensions are 0, using defaults and will resize later');
        containerWidth = 800;
        containerHeight = 600;
      }
      
      this.stage = new Konva.Stage({
        container: container,
        width: containerWidth,
        height: containerHeight
      });
      
      try { this.stage.listening(true); } catch (_) {}
      
      console.log('🔧 Konva stage created:', this.stage);
      console.log('🔧 Stage dimensions:', {
        width: this.stage.width(),
        height: this.stage.height()
      });
      
      // Store initial dimensions for reference
      this.stageWidth = this.stage.width();
      this.stageHeight = this.stage.height();

      // Create layers for different elements
      this.backgroundLayer = new Konva.Layer();
      this.imageLayer = new Konva.Layer();
      this.blocksLayer = new Konva.Layer({ listening: true });
      this.arrowsLayer = new Konva.Layer();

      try {
        this.blocksLayer.listening(true);
        if (this.blocksLayer.hitGraphEnabled) this.blocksLayer.hitGraphEnabled(true);
      } catch (_) {}

      // Add layers to stage
      this.stage.add(this.backgroundLayer);
      this.stage.add(this.imageLayer);
      this.stage.add(this.blocksLayer);
      this.stage.add(this.arrowsLayer);

      // Add background with subtle pattern
      const background = new Konva.Rect({
        x: 0,
        y: 0,
        width: this.stage.width(),
        height: this.stage.height(),
        fill: '#f8f9fa',
        stroke: '#dee2e6',
        strokeWidth: 1,
        listening: false
      });
      this.backgroundLayer.add(background);

      // Set up stage events with better performance
      this.setupStageEvents();
      
      // Handle window resize to update stage dimensions
      this.handleResize = () => {
        const newWidth = container.offsetWidth || container.clientWidth || 800;
        const newHeight = container.offsetHeight || container.clientHeight || 600;
        
        if (newWidth !== this.stageWidth || newHeight !== this.stageHeight) {
          console.log('🔄 Resizing stage from', { width: this.stageWidth, height: this.stageHeight }, 'to', { width: newWidth, height: newHeight });
          
          this.stage.width(newWidth);
          this.stage.height(newHeight);
          this.stageWidth = newWidth;
          this.stageHeight = newHeight;
          
          // Update background
          this.backgroundLayer.destroyChildren();
          const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: newWidth,
            height: newHeight,
            fill: '#f8f9fa',
            stroke: '#dee2e6',
            strokeWidth: 1,
            listening: false
          });
          this.backgroundLayer.add(background);
          
          // Re-center image if it exists
          if (this.imageInfo) {
            this.recenterImage();
          }
          
          this.stage.batchDraw();
        }
      };
      
      // Bind resize handler
      window.addEventListener('resize', this.handleResize);
      
      // Add method to resize stage to container
      this.resizeStageToContainer = () => {
        const container = this.stage.container();
        if (!container) return;
        
        // Force layout recalculation
        container.style.display = 'block';
        container.offsetHeight; // Force reflow
        
        const newWidth = container.offsetWidth || container.clientWidth || 800;
        const newHeight = container.offsetHeight || container.clientHeight || 600;
        
        console.log('🔄 Resizing stage to container dimensions:', { width: newWidth, height: newHeight });
        
        if (newWidth > 0 && newHeight > 0 && (newWidth !== this.stageWidth || newHeight !== this.stageHeight)) {
          this.stage.width(newWidth);
          this.stage.height(newHeight);
          this.stageWidth = newWidth;
          this.stageHeight = newHeight;
          
          // Update background
          this.backgroundLayer.destroyChildren();
          const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: newWidth,
            height: newHeight,
            fill: '#f8f9fa',
            stroke: '#dee2e6',
            strokeWidth: 1,
            listening: false
          });
          this.backgroundLayer.add(background);
          
          // Re-center image if it exists
          if (this.imageInfo) {
            this.recenterImage();
          }
          
          this.stage.batchDraw();
        }
      };
      
      console.log('✅ Konva initialization complete');
    }

         setupStageEvents() {
       // Handle stage clicks with better performance
       this.stage.on('click', (e) => {
         // Only deselect if we clicked on the stage background, not on shapes
         if (e.target === this.stage) {
           console.log('🖱️ Clicked on stage background, deselecting all');
           this.deselectAll();
         }
       });

      // Mousemove is handled per-mode; avoid double handlers here

      // Drag-only mode: no global mouse tracking for edge detection

      // Resize mousedown/mouseup handled in mode handlers to avoid conflicts

       // Optimize stage updates
       this.stage.on('dragmove', () => {
         this.stage.batchDraw();
       });
     }

      // Handle edge detection for resizing
      handleEdgeDetection(pos) {
        console.log('🔍 Edge detection called at position:', pos);
        
        // Find any block under the cursor
        let blockUnderCursor = null;
        let cursor = 'default';
        this.resizeDir = null;
        
        // Check all blocks to see if cursor is near any of them
        for (let i = this.blocks.length - 1; i >= 0; i--) {
          const block = this.blocks[i];
          const rect = block.rect;
          
          // Use getClientRect for accurate positioning
          const box = rect.getClientRect();
          
          // Check if cursor is within block bounds (with some padding)
          const padding = 20; // Extra area around block for easier detection
          if (pos.x >= box.x - padding && pos.x <= box.x + box.width + padding &&
              pos.y >= box.y - padding && pos.y <= box.y + box.height + padding) {
            
            blockUnderCursor = block;
            console.log('🔍 Cursor over block:', block.id, 'box:', box);
            break;
          }
        }
        
        if (!blockUnderCursor) {
          this.stage.container().style.cursor = 'default';
          this.hoveredBlock = null;
          return;
        }
        
        // Now check if cursor is near edges of this block
        const rect = blockUnderCursor.rect;
        const box = rect.getClientRect();
        const margin = 8; // how close to edge counts as "resize zone"
        
        console.log('🔍 Checking edges for block:', blockUnderCursor.id, 'margin:', margin);
        
        // Simple edge detection
        if (Math.abs(pos.x - box.x) < margin) {
          cursor = 'ew-resize';
          this.resizeDir = 'left';
          console.log('🔍 LEFT edge detected');
        } else if (Math.abs(pos.x - (box.x + box.width)) < margin) {
          cursor = 'ew-resize';
          this.resizeDir = 'right';
          console.log('🔍 RIGHT edge detected');
        } else if (Math.abs(pos.y - box.y) < margin) {
          cursor = 'ns-resize';
          this.resizeDir = 'top';
          console.log('🔍 TOP edge detected');
        } else if (Math.abs(pos.y - (box.y + box.height)) < margin) {
          cursor = 'ns-resize';
          this.resizeDir = 'bottom';
          console.log('🔍 BOTTOM edge detected');
        } else {
          cursor = 'default';
          this.resizeDir = null;
        }

        if (this.resizeDir) {
          console.log('🔍 Edge detected:', this.resizeDir, 'on block:', blockUnderCursor.id);
          this.hoveredBlock = blockUnderCursor;
        } else {
          this.hoveredBlock = null;
        }
        
        this.stage.container().style.cursor = cursor;
      }

      // Handle edge resizing
      handleEdgeResize(e) {
        if (!this.resizing || !this.resizeDir || !this.hoveredBlock) {
          return;
        }

        const pos = this.stage.getPointerPosition();
        if (!pos) return;

        const rect = this.hoveredBlock.rect;
        let newAttrs = rect.getAttrs();
        
        // Simple resize logic based on active edge
        if (this.resizeDir === 'right') {
          newAttrs.width = pos.x - rect.x();
        } else if (this.resizeDir === 'bottom') {
          newAttrs.height = pos.y - rect.y();
        } else if (this.resizeDir === 'left') {
          newAttrs.width = rect.width() + (rect.x() - pos.x);
          newAttrs.x = pos.x;
        } else if (this.resizeDir === 'top') {
          newAttrs.height = rect.height() + (rect.y() - pos.y);
          newAttrs.y = pos.y;
        }
        
        // Prevent flipping and ensure minimum size
        if (newAttrs.width > 20 && newAttrs.height > 20) {
          rect.setAttrs(newAttrs);
          
          // Update stored block data
          const blockData = this.blocks.find(b => b.id === this.hoveredBlock.id);
          if (blockData) {
            blockData.width = newAttrs.width;
            blockData.height = newAttrs.height;
            blockData.x = newAttrs.x;
            blockData.y = newAttrs.y;
          }
          
          this.stage.batchDraw();
        }
      }

    

    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.handleImageFile(file);
      }
    }

    async handleImageFile(file) {
      console.log('📁 Handling image file:', file.name, file.size, 'bytes');
      this.showUploadStatus('Uploading image to Cloudinary...', 'uploading');
      
      try {
        // Convert file to data URL
        const dataUrl = await this.fileToDataUrl(file);
        console.log('📁 Converted file to data URL, length:', dataUrl.length);
        
        // Send as JSON with dataUrl to correct endpoint
        const response = await window.tokenManager.makeAuthenticatedRequest(
          '/.netlify/functions/upload-image',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: dataUrl,
              folder: 'matching_tests'
            })
          }
        );
        
        const result = await response.json();
        
        if (response.ok && result.success && result.url) {
          // Use the real Cloudinary URL
          this.image = result.url;
          
          // Store image dimensions for coordinate calculations
          this.imageWidth = result.width;
          this.imageHeight = result.height;
          console.log('✅ Image uploaded to Cloudinary:', result.url);
          console.log('📏 Image dimensions stored:', this.imageWidth, 'x', this.imageHeight);
          
          this.showUploadStatus('Image uploaded successfully!', 'success');
          this.showImageEditor();
          this.createWordsEditor();
          
          // Load image into Konva using the real URL
          this.loadImageToKonva(result.url);
        } else {
          throw new Error(result.message || 'Upload failed');
        }
        
      } catch (error) {
        console.error('❌ Error uploading image:', error);
        this.showUploadStatus('Failed to upload image: ' + error.message, 'error');
      }
    }

    showUploadStatus(message, type) {
      const statusDiv = this.container.querySelector('#uploadStatus');
      statusDiv.textContent = message;
      statusDiv.className = `upload-status ${type}`;
      statusDiv.style.display = 'block';
    }

    // Convert file to data URL for upload
    fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    }

    showImageEditor() {
      console.log('🎨 Showing image editor...');
      const imageEditor = this.container.querySelector('#imageEditor');
      
      if (imageEditor) {
        imageEditor.style.display = 'block';
        console.log('✅ Image editor displayed');
        
        // Resize stage to match container dimensions after image editor is shown
        setTimeout(() => {
          this.resizeStageToContainer();
        }, 100);
      } else {
        console.error('❌ Image editor not found!');
      }
      
      // Set default mode to block mode
      this.enableBlockMode();
    }

    loadImageToKonva(imageUrl) {
      const img = new Image();
      
      img.onload = () => {
        // Ensure stage has proper dimensions before positioning image
        if (this.stageWidth === 800 && this.stageHeight === 600) {
          console.log('🔄 Stage still has default dimensions, attempting to resize...');
          this.resizeStageToContainer();
        }
        
        // Use stored stage dimensions for consistent positioning
        const stageWidth = this.stageWidth || this.stage.width();
        const stageHeight = this.stageHeight || this.stage.height();
        
        // Calculate scale to fit canvas with some padding
        const padding = 40; // Add padding around image
        const availableWidth = stageWidth - padding;
        const availableHeight = stageHeight - padding;
        const scale = Math.min(availableWidth / img.width, availableHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center image on canvas
        const x = (stageWidth - scaledWidth) / 2;
        const y = (stageHeight - scaledHeight) / 2;
        
        console.log('🖼️ Image positioning:', {
          originalSize: { width: img.width, height: img.height },
          stageSize: { width: stageWidth, height: stageHeight },
          scaledSize: { width: scaledWidth, height: scaledHeight },
          position: { x, y },
          scale: scale,
          padding: padding
        });
        
        // Create Konva image
        const konvaImage = new Konva.Image({
          x: x,
          y: y,
          image: img,
          width: scaledWidth,
          height: scaledHeight
        });
        
        // Clear previous image
        this.imageLayer.destroyChildren();
        this.imageLayer.add(konvaImage);
        
        // Store image info for block positioning
        this.imageInfo = {
          x, y, width: scaledWidth, height: scaledHeight,
          scale: scale,
          originalWidth: img.width,
          originalHeight: img.height
        };
        
        // Store original image dimensions for relative coordinate calculations
        this.originalImageWidth = img.width;
        this.originalImageHeight = img.height;
        
        console.log('🖼️ Original image dimensions stored:', {
          width: this.originalImageWidth,
          height: this.originalImageHeight
        });
        
        this.stage.batchDraw();
      };
      
      img.src = imageUrl;
    }
    
    // Method to re-center image when stage is resized
    recenterImage() {
      if (!this.imageInfo) return;
      
      const stageWidth = this.stageWidth;
      const stageHeight = this.stageHeight;
      
      // Recalculate position for new stage dimensions
      const x = (stageWidth - this.imageInfo.width) / 2;
      const y = (stageHeight - this.imageInfo.height) / 2;
      
      // Update image position
      const konvaImage = this.imageLayer.getChildren()[0];
      if (konvaImage) {
        konvaImage.x(x);
        konvaImage.y(y);
        
        // Update stored image info
        this.imageInfo.x = x;
        this.imageInfo.y = y;
        
        console.log('🔄 Image re-centered to:', { x, y });
      }
    }

         enableBlockMode() {
       this.isDrawingArrow = false;
       this.arrowStart = null;
       this.isCreatingBlock = false;
       this.blockCreationStart = null;
       this.previewBlock = null;
       
       this.container.querySelector('#addBlockBtn').classList.add('active');
       this.container.querySelector('#addArrowBtn').classList.remove('active');
       // Reset cursor to default in block mode
       this.stage.container().style.cursor = 'default';
       
       // Set up stage for block creation with mouse tracking and edge-resize support
       this.stage.off('click');
       this.stage.off('mousedown');
       this.stage.off('mousemove');
       this.stage.off('mouseup');
       
       // Click-drag on empty space to size a new block. If press starts on a block, let the block/group handle it
       this.stage.on('mousedown', (e) => {
        try {
          console.log('🧪 Stage mousedown:', {
            targetIsStage: e.target === this.stage,
            targetClass: e.target && e.target.getClassName && e.target.getClassName(),
            targetId: e.target && e.target.id && e.target.id()
          });
        } catch (_) {}
         // Only start creation when clicking on stage background (not on shapes)
         if (e.target !== this.stage) {
           try {
             console.log('🧪 Stage mousedown ignored. Target is not stage:', {
               targetClass: e.target && e.target.getClassName && e.target.getClassName(),
               targetId: e.target && e.target.id && e.target.id(),
               isInBlockGroup: !!(e.target && e.target.findAncestor && e.target.findAncestor('.block-group', true))
             });
           } catch (_) {}
           return;
         }
         const pos = this.stage.getPointerPosition();
         if (!pos) return;
         this.handleBlockCreationStart(e);
       });
       
       this.stage.on('mousemove', (e) => {
         if (this.isCreatingBlock) {
           this.handleBlockCreationMove(e);
         }
       });
       
       this.stage.on('mouseup', (e) => {
         if (this.isCreatingBlock) {
           this.handleBlockCreationEnd(e);
         }
       });
       
       console.log('🎯 Block mode enabled - click a block to select, click-drag to create sized blocks');
     }

           enableArrowMode() {
    this.isDrawingArrow = true;
    this.arrowStart = null;
    this.isCreatingBlock = false;
    this.blockCreationStart = null;
    this.previewBlock = null;
    
    this.container.querySelector('#addBlockBtn').classList.remove('active');
    this.container.querySelector('#addArrowBtn').classList.add('active');
    // Set cursor to crosshair in arrow mode to avoid resize cursor confusion
    this.stage.container().style.cursor = 'crosshair';
    
    // Set up stage for arrow creation with proper drawing behavior
    this.stage.off('click');
    this.stage.off('mousedown');
    this.stage.off('mousemove');
    this.stage.off('mouseup');
    
    // Arrow drawing, but still maintain edge detection cursor for clarity
    this.stage.on('mousedown', (e) => this.handleArrowMouseDown(e));
    this.stage.on('mousemove', (e) => {
      // Do not run edge detection in arrow mode to avoid misleading resize cursor
      this.handleArrowMouseMove(e);
    });
    this.stage.on('mouseup', (e) => this.handleArrowMouseUp(e));
    
    console.log('🎯 Arrow mode enabled - click and drag to draw arrows');
  }

    // Handle single-click stage clicks
    handleSingleClickStageClick(e) {
      const pos = this.stage.getPointerPosition();
      
      // Check if click is within image bounds
      if (this.imageInfo && 
          pos.x >= this.imageInfo.x && pos.x <= this.imageInfo.x + this.imageInfo.width &&
          pos.y >= this.imageInfo.y && pos.y <= this.imageInfo.y + this.imageInfo.height) {
        
        // Check if we clicked on an existing block first
        const clickedBlock = this.findBlockAtPosition(pos.x, pos.y);
        if (clickedBlock) {
          console.log('🖱️ Clicked on existing block:', clickedBlock.id);
          this.selectShape(clickedBlock.group);
        } else {
          console.log('🆕 Creating simple block at:', pos.x, pos.y);
          this.createBlock(pos.x, pos.y, 30, 10);
        }
      }
    }

    handleStageClick(e) {
      const pos = this.stage.getPointerPosition();
      
      // Check if click is within image bounds
      if (this.imageInfo && 
          pos.x >= this.imageInfo.x && pos.x <= this.imageInfo.x + this.imageInfo.width &&
          pos.y >= this.imageInfo.y && pos.y <= this.imageInfo.y + this.imageInfo.height) {
        
        if (this.isDrawingArrow) {
          this.handleArrowClick(pos.x, pos.y);
        } else {
          // Check if we clicked on an existing block first
          const clickedBlock = this.findBlockAtPosition(pos.x, pos.y);
          if (clickedBlock) {
            console.log('🖱️ Clicked on existing block:', clickedBlock.id);
            this.selectShape(clickedBlock.group);
          } else {
            console.log('🆕 Creating new block at:', pos.x, pos.y);
            this.createBlock(pos.x, pos.y);
          }
        }
      }
    }



         // Handle block creation start
     handleBlockCreationStart(e) {
       const pos = this.stage.getPointerPosition();
       
       // Check if click is within image bounds
       if (this.imageInfo && 
           pos.x >= this.imageInfo.x && pos.x <= this.imageInfo.x + this.imageInfo.width &&
           pos.y >= this.imageInfo.y && pos.y <= this.imageInfo.y + this.imageInfo.height) {
         
         // Check if we clicked on an existing block first
         const clickedBlock = this.findBlockAtPosition(pos.x, pos.y);
         if (clickedBlock) {
           console.log('🖱️ Clicked on existing block:', clickedBlock.id);
           // If stage was the event target, hit graph missed; force drag on the group
           try {
             if (e) {
               e.cancelBubble = true;
               if (e.evt) e.evt.cancelBubble = true;
             }
             this.selectShape(clickedBlock.group);
             clickedBlock.group.startDrag();
             console.log('✅ Forced startDrag on existing block via stage handler');
           } catch (err) {
             console.warn('⚠️ Unable to force startDrag from stage handler:', err);
           }
           return;
         }
         
         // Start block creation
         this.isCreatingBlock = true;
         this.blockCreationStart = { x: pos.x, y: pos.y };
         
         // Create preview block
         this.previewBlock = new Konva.Rect({
           x: pos.x,
           y: pos.y,
           width: 0,
           height: 0,
           fill: 'rgba(0, 123, 255, 0.3)',
           stroke: '#007bff',
           strokeWidth: 2,
           dash: [5, 5],
           opacity: 0.7
         });
         
         this.blocksLayer.add(this.previewBlock);
         this.stage.batchDraw();
         
         console.log('🎯 Block creation started at:', pos.x, pos.y);
       }
     }

         // Handle block creation move
     handleBlockCreationMove(e) {
       if (!this.isCreatingBlock || !this.previewBlock) return;
       
       const pos = this.stage.getPointerPosition();
       if (!pos) return;
       
       // Calculate block dimensions
       const width = Math.abs(pos.x - this.blockCreationStart.x);
       const height = Math.abs(pos.y - this.blockCreationStart.y);
       
       // Ensure minimum size
       const minSize = 20;
       const finalWidth = Math.max(width, minSize);
       const finalHeight = Math.max(height, minSize);
       
       // Update preview block
       this.previewBlock.x(Math.min(pos.x, this.blockCreationStart.x));
       this.previewBlock.y(Math.min(pos.y, this.blockCreationStart.y));
       this.previewBlock.width(finalWidth);
       this.previewBlock.height(finalHeight);
       
       this.stage.batchDraw();
     }

         

         // Handle block creation end
     handleBlockCreationEnd(e) {
       if (!this.isCreatingBlock || !this.previewBlock) return;
       
       const pos = this.stage.getPointerPosition();
       if (!pos) return;
       
       // Calculate final block dimensions
       const width = Math.abs(pos.x - this.blockCreationStart.x);
       const height = Math.abs(pos.y - this.blockCreationStart.y);
       
       // Ensure minimum size
       const minSize = 20;
       const finalWidth = Math.max(width, minSize);
       const finalHeight = Math.max(height, minSize);
       
       // Calculate final position
       const finalX = Math.min(pos.x, this.blockCreationStart.x);
       const finalY = Math.min(pos.y, this.blockCreationStart.y);
       
       // Remove preview block
       this.previewBlock.destroy();
       this.previewBlock = null;
       
       // Create the actual block
       this.createBlock(finalX + finalWidth/2, finalY + finalHeight/2, finalWidth, finalHeight);
       
       // Reset creation state
       this.isCreatingBlock = false;
       this.blockCreationStart = null;
       
       this.stage.batchDraw();
       console.log('✅ Block created with dimensions:', finalWidth, 'x', finalHeight);
     }

         

    // Find block at a specific position
    findBlockAtPosition(x, y) {
      for (let i = this.blocks.length - 1; i >= 0; i--) {
        const block = this.blocks[i];
        if (x >= block.x && x <= block.x + block.width &&
            y >= block.y && y <= block.y + block.height) {
          return block;
        }
      }
      return null;
    }

    // Compute the lowest available positive block id (1..n with gaps)
    getNextBlockId() {
      const used = new Set(this.blocks.map(b => b.id));
      let candidate = 1;
      while (used.has(candidate)) candidate++;
      return candidate;
    }

    createBlock(x, y, width = 30, height = 10) {
      const blockId = this.getNextBlockId();
      
      // Create group as the draggable container
      const blockGroup = new Konva.Group({
        x: x - width/2,
        y: y - height/2,
        draggable: true,
        id: `blockGroup-${blockId}`,
        data: { blockId, type: 'block' },
        name: 'block-group',
        listening: true,
        dragDistance: 0
      });

      // Rectangle positioned at (0,0) inside group
      const block = new Konva.Rect({
        x: 0,
        y: 0,
        width: width,
        height: height,
        fill: 'rgba(0, 123, 255, 0.15)',
        stroke: '#007bff',
        strokeWidth: 2,
        id: `block-${blockId}`,
        data: { blockId, type: 'block' },
        cornerRadius: 6,
        shadowColor: 'rgba(0, 123, 255, 0.3)',
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 2 },
        shadowOpacity: 0.5,
        listening: true
      });

      // Number badge using Konva.Label for background
      const numberLabel = new Konva.Label({ x: 0, y: -28 });
      const numberTag = new Konva.Tag({ fill: '#007bff', cornerRadius: 4, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 4, shadowOffset: { x: 0, y: 1 } });
      const numberText = new Konva.Text({
        text: blockId.toString(),
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        fill: 'white',
        padding: 6
      });
      numberLabel.add(numberTag);
      numberLabel.add(numberText);

      blockGroup.add(block);
      blockGroup.add(numberLabel);
      console.log('🔧 Created block group draggable:', blockGroup.draggable());
      console.log('🔧 Group position:', { x: blockGroup.x(), y: blockGroup.y() });
      console.log('🧭 Block created debug:', {
        blockId,
        groupId: blockGroup.id(),
        rectId: block.id(),
        groupDraggable: blockGroup.draggable(),
        rectDraggable: block.draggable(),
        groupListening: blockGroup.listening(),
        rectListening: block.listening(),
        absPos: blockGroup.getAbsolutePosition()
      });
      
      // numberLabel is the badge; no duplicate adds

      // Add enhanced events
      this.addBlockEvents(blockGroup, blockId, block);

      // Add to layer
      this.blocksLayer.add(blockGroup);
      
      // Animate block appearance
      this.animateBlockAppearance(block, numberLabel);
      
      this.stage.batchDraw();

      // Store block data with correct coordinates (group position)
      this.blocks.push({
        id: blockId,
        group: blockGroup,
        rect: block,
        x: blockGroup.x(),
        y: blockGroup.y(),
        width: width,
        height: height
      });

      // Ensure a matching word slot exists for this block id
      if (!this.words.find(w => w.blockId === blockId)) {
        this.words.push({ blockId, word: '' });
      }

      this.updateWordsEditor();
    }

    animateBlockAppearance(block, numberLabel) {
      // Simple fade-in animation
      block.opacity(0);
      numberLabel.opacity(0);
      
      const animation = new Konva.Animation((frame) => {
        const progress = frame.time / 200; // 200ms duration
        
        if (progress >= 1) {
          animation.stop();
          block.opacity(1);
          numberLabel.opacity(1);
        } else {
          block.opacity(progress);
          numberLabel.opacity(progress);
        }
        
        this.stage.batchDraw();
      });
      
      animation.start();
    }

         addResizeHandles(group, rect) {
       // No more resize handles - we'll use edge detection instead
       // This method is kept for compatibility but doesn't add anything
       console.log('🔧 Resize handles disabled - using edge detection instead');
     }

                   updateHandlePositions(group, width, height) {
       // Update block number position
       const blockNumber = group.findOne('Text');
       if (blockNumber) {
         blockNumber.x(-8);
         blockNumber.y(-28);
       }
     }

    addBlockEvents(group, blockId, block) {
      console.log('🔗 Adding events to block:', blockId);
      console.log('🔗 Block draggable states:', { group: group.draggable(), rect: block.draggable() });
      console.log('🔗 Initial positions:', { group: { x: group.x(), y: group.y() }, rect: { x: block.x(), y: block.y() } });
      
      // Selection with better visual feedback (use group for selection)
      group.on('click', (e) => {
        console.log('🖱️ Block clicked:', blockId);
        console.log('🖱️ Click event target:', e.target);
        console.log('🖱️ Group draggable state:', group.draggable());
        // prevent bubbling to stage
        e.cancelBubble = true;
        if (e.evt) e.evt.cancelBubble = true;
        this.selectShape(group);
      });

      // Enhanced drag events on group
      group.on('dragstart', (e) => {
        console.log('🔧 Block drag started:', blockId);
        console.log('🔧 Group draggable state:', group.draggable());
        console.log('🔧 Drag event target:', e.target);
        try {
          console.log('🧭 dragstart debug:', {
            pointer: this.stage.getPointerPosition(),
            groupPos: { x: group.x(), y: group.y() },
            absPos: group.getAbsolutePosition(),
            isDragging: group.isDragging()
          });
        } catch (_) {}
        // Add visual feedback during drag
        block.shadowBlur(20);
        block.shadowOffset({ x: 0, y: 4 });
        block.stroke('#28a745');
        block.strokeWidth(3);
        
        this.stage.batchDraw();
      });

      // Ensure drag begins when pressing on the group (desktop & touch)
      group.on('mousedown touchstart', (e) => {
        try {
          console.log('🧪 group mousedown/touchstart:', {
            blockId,
            targetClass: e.target && e.target.getClassName && e.target.getClassName(),
            pointer: this.stage.getPointerPosition(),
            groupDraggable: group.draggable(),
            isDraggingBefore: group.isDragging(),
            buttons: e.evt && e.evt.buttons
          });
        } catch (_) {}
        e.cancelBubble = true;
        if (e.evt) e.evt.cancelBubble = true;
        try { group.startDrag(); console.log('✅ group.startDrag() called'); } catch (err) { console.warn('⚠️ group.startDrag error:', err); }
      });

      // Also start drag when pressing directly on the rect
      block.on('mousedown touchstart', (e) => {
        try {
          console.log('🧪 rect mousedown/touchstart:', {
            blockId,
            targetClass: e.target && e.target.getClassName && e.target.getClassName(),
            pointer: this.stage.getPointerPosition(),
            groupDraggable: group.draggable(),
            isDraggingBefore: group.isDragging(),
            buttons: e.evt && e.evt.buttons
          });
        } catch (_) {}
        e.cancelBubble = true;
        if (e.evt) e.evt.cancelBubble = true;
        try { group.startDrag(); console.log('✅ group.startDrag() called from rect'); } catch (err) { console.warn('⚠️ group.startDrag error (rect):', err); }
      });

      group.on('dragmove', (e) => {
        try {
          console.log('🔧 Block drag move:', blockId, {
            groupPos: { x: group.x(), y: group.y() },
            rectLocalPos: { x: block.x(), y: block.y() },
            absPos: group.getAbsolutePosition(),
            pointer: this.stage.getPointerPosition()
          });
        } catch (_) {}
        // Update stored data (group position)
        const blockData = this.blocks.find(b => b.id === blockId);
        if (blockData) {
          blockData.x = group.x();
          blockData.y = group.y();
          console.log('📊 Block position updated:', { id: blockId, x: blockData.x, y: blockData.y });
        }
        
        this.stage.batchDraw();
      });

      group.on('dragend', (e) => {
        console.log('🔧 Block drag ended:', blockId);
        console.log('🔧 Final position:', { x: group.x(), y: group.y() });
        try {
          console.log('🧭 dragend debug:', {
            absPos: group.getAbsolutePosition(),
            pointer: this.stage.getPointerPosition(),
            isDraggingAfter: group.isDragging()
          });
        } catch (_) {}
        // Restore normal appearance
        block.shadowBlur(10);
        block.shadowOffset({ x: 0, y: 2 });
        block.stroke('#007bff');
        block.strokeWidth(2);
        
        this.stage.batchDraw();
      });

      // Right-click for delete
      group.on('contextmenu', (e) => {
        e.evt.preventDefault();
        if (confirm('Delete this block?')) {
          this.deleteBlock(blockId);
        }
      });

      // Enhanced hover effects for better UX
      group.on('mouseenter', () => {
        if (this.selectedShape !== group) {
          block.stroke('#0056b3');
          block.strokeWidth(3);
          this.stage.batchDraw();
        }
      });

      group.on('mouseleave', () => {
        if (this.selectedShape !== group) {
          block.stroke('#007bff');
          block.strokeWidth(2);
          this.stage.batchDraw();
        }
      });
      
      console.log('✅ Block events added for block:', blockId);
    }

    

         selectShape(shape) {
        console.log('🎯 Selecting shape:', shape);
        this.deselectAll();
        this.selectedShape = shape;
        
        // Highlight selected shape
        if (shape.findOne('Rect')) {
          const rect = shape.findOne('Rect');
          rect.stroke('#28a745');
          rect.strokeWidth(3);
          rect.shadowBlur(20);
          rect.shadowOffset({ x: 0, y: 4 });
          console.log('✅ Block selected and highlighted');
          
          // Show delete block button
          this.showDeleteBlockButton();
        } else if (shape.findOne('Line')) {
          const line = shape.findOne('Line');
          line.stroke('#28a745');
          line.strokeWidth(4);
          line.shadowBlur(15);
          line.shadowOffset({ x: 0, y: 2 });
          console.log('✅ Arrow selected and highlighted');
          
          // Show delete arrow button
          this.showDeleteArrowButton();
        }
        
        this.stage.batchDraw();
      }

      // Deselect all shapes
      deselectAll() {
        if (this.selectedShape) {
          if (this.selectedShape.findOne('Rect')) {
            const rect = this.selectedShape.findOne('Rect');
            rect.stroke('#007bff');
            rect.strokeWidth(2);
            rect.shadowBlur(10);
            rect.shadowOffset({ x: 0, y: 2 });
          } else if (this.selectedShape.findOne('Line')) {
            const line = this.selectedShape.findOne('Line');
            line.stroke('#6c757d');
            line.strokeWidth(2);
            line.shadowBlur(0);
            line.shadowOffset({ x: 0, y: 0 });
          }
          this.selectedShape = null;
        }
        
        // Hide all delete buttons
        this.hideDeleteButtons();
        
        this.stage.batchDraw();
      }

      // Show delete block button
      showDeleteBlockButton() {
        const deleteBlockBtn = document.getElementById('deleteBlockBtn');
        const deleteArrowBtn = document.getElementById('deleteArrowBtn');
        
        if (deleteBlockBtn) deleteBlockBtn.style.display = 'inline-block';
        if (deleteArrowBtn) deleteArrowBtn.style.display = 'none';
      }

      // Show delete arrow button
      showDeleteArrowButton() {
        const deleteBlockBtn = document.getElementById('deleteBlockBtn');
        const deleteArrowBtn = document.getElementById('deleteArrowBtn');
        
        if (deleteBlockBtn) deleteBlockBtn.style.display = 'none';
        if (deleteArrowBtn) deleteArrowBtn.style.display = 'inline-block';
      }

      // Hide all delete buttons
      hideDeleteButtons() {
        const deleteBlockBtn = document.getElementById('deleteBlockBtn');
        const deleteArrowBtn = document.getElementById('deleteArrowBtn');
        
        if (deleteBlockBtn) deleteBlockBtn.style.display = 'none';
        if (deleteArrowBtn) deleteArrowBtn.style.display = 'none';
      }

    

    

    deleteBlock(blockId) {
      // Remove from array
      const blockIndex = this.blocks.findIndex(b => b.id === blockId);
      if (blockIndex !== -1) {
        const block = this.blocks[blockIndex];
        
        // Remove from layer
        block.group.destroy();
        
        // Remove from array
        this.blocks.splice(blockIndex, 1);
        
        // Remove associated words
        this.words = this.words.filter(w => w.blockId !== blockId);

        // Remove arrows that start inside this block bounds
        const bx = block.x;
        const by = block.y;
        const bw = block.width;
        const bh = block.height;
        const inside = (ax, ay) => ax >= bx && ax <= bx + bw && ay >= by && ay <= by + bh;
        for (let i = this.arrows.length - 1; i >= 0; i--) {
          const a = this.arrows[i];
          if (inside(a.start_x, a.start_y) || inside(a.end_x, a.end_y)) {
            if (a.group && typeof a.group.destroy === 'function') a.group.destroy();
            this.arrows.splice(i, 1);
          }
        }
        
        // Update words editor
        this.updateWordsEditor();
        
        this.stage.batchDraw();
      }
    }

         // Arrow handling methods - implementing proper drawing behavior
     handleArrowMouseDown(e) {
       if (this.isDrawingArrow) {
         const pos = this.stage.getPointerPosition();
         if (!pos) return;
         
         console.log('🎯 Arrow drawing started at:', pos.x, pos.y);
         
         // Create arrow with start and end at same position initially
         this.currentArrow = new Konva.Arrow({
           points: [pos.x, pos.y, pos.x, pos.y], // start and end same at first
           pointerLength: 10,
           pointerWidth: 10,
           fill: '#dc3545',
           stroke: '#dc3545',
           strokeWidth: 3,
           id: `arrow-${++this.currentArrowId}`,
           data: { arrowId: this.currentArrowId, type: 'arrow' }
         });
         
         this.arrowsLayer.add(this.currentArrow);
         this.stage.batchDraw();
       }
     }
     
     handleArrowMouseMove(e) {
       if (this.isDrawingArrow && this.currentArrow) {
         const pos = this.stage.getPointerPosition();
         if (!pos) return;
         
         // Update arrow end point while dragging
         const points = this.currentArrow.points();
         this.currentArrow.points([points[0], points[1], pos.x, pos.y]);
         this.stage.batchDraw();
       }
     }
     
     handleArrowMouseUp(e) {
       if (this.isDrawingArrow && this.currentArrow) {
         const pos = this.stage.getPointerPosition();
         if (!pos) return;
         
         console.log('✅ Arrow drawing completed at:', pos.x, pos.y);
         
         // Get original coordinates
         const points = this.currentArrow.points();
         
         // REMOVE the original arrow from display to prevent duplicates
         this.currentArrow.destroy();
         
         // Create magneted arrow (replaces the original)
         this.createArrow(points[0], points[1], pos.x, pos.y);
         
         // Reset for next arrow
         this.currentArrow = null;
         this.isDrawingArrow = false;
       }
     }
     
     // Legacy method for compatibility (can be removed later)
     handleArrowClick(x, y) {
       if (!this.arrowStart) {
         // First click - start arrow
         this.arrowStart = { x, y };
         
         // Start mouse tracking for preview
         this.startArrowPreview();
       } else {
         // Second click - end arrow
         this.createArrow(this.arrowStart.x, this.arrowStart.y, x, y);
         this.arrowStart = null;
         this.stopArrowPreview();
         
         // Reset to block mode after creating arrow
         this.enableBlockMode();
       }
     }

    startArrowPreview() {
      console.log('🎯 Starting arrow preview');
      const mouseMoveHandler = (e) => {
        if (!this.arrowStart) return;
        
        const pos = this.stage.getPointerPosition();
        if (pos) {
          this.updateArrowPreview(pos.x, pos.y);
        }
      };
      
      const mouseUpHandler = (e) => {
        if (!this.arrowStart) return;
        
        const pos = this.stage.getPointerPosition();
        if (pos) {
          console.log('🎯 Arrow preview ended, creating arrow from', this.arrowStart, 'to', pos);
          this.createArrow(this.arrowStart.x, this.arrowStart.y, pos.x, pos.y);
          this.arrowStart = null;
          this.stopArrowPreview();
          
          // Reset to block mode after creating arrow
          this.enableBlockMode();
          
          // Remove event listeners
          this.stage.off('mousemove', mouseMoveHandler);
          this.stage.off('mouseup', mouseUpHandler);
        }
      };
      
      this.stage.on('mousemove', mouseMoveHandler);
      this.stage.on('mouseup', mouseUpHandler);
    }

    stopArrowPreview() {
      this.removeArrowPreview();
    }

    updateArrowPreview(endX, endY) {
      this.removeArrowPreview();
      
      if (!this.arrowStart) return;
      
      // Create preview arrow
      const previewArrow = new Konva.Line({
        points: [this.arrowStart.x, this.arrowStart.y, endX, endY],
        stroke: '#dc3545',
        strokeWidth: 3,
        dash: [5, 5],
        opacity: 0.6
      });
      
      this.arrowsLayer.add(previewArrow);
      this.stage.batchDraw();
      
      // Store reference for removal
      this.previewArrow = previewArrow;
    }

    removeArrowPreview() {
      if (this.previewArrow) {
        this.previewArrow.destroy();
        this.previewArrow = null;
        this.stage.batchDraw();
      }
    }

    createArrow(startX, startY, endX, endY) {
      const arrowId = ++this.currentArrowId;
      console.log('➡️ Creating arrow:', { startX, startY, endX, endY });
      
      // MAGNETIC SNAPPING: Only snap arrow START to nearby blocks
      const snappedStart = this.snapToNearestBlock(startX, startY);
      
      // Use snapped coordinates for start if available, otherwise use original
      const finalStartX = snappedStart ? snappedStart.x : startX;
      const finalStartY = snappedStart ? snappedStart.y : startY;
      // End point is free - use original coordinates
      const finalEndX = endX;
      const finalEndY = endY;
      
      // VALIDATION: Ensure arrow is near at least one block
      if (!this.validateArrowPlacement(finalStartX, finalStartY, finalEndX, finalEndY)) {
        console.log(`❌ Arrow ${arrowId} validation failed - cancelling creation`);
        return; // Don't create the arrow
      }
      
      // Find which block this arrow is associated with using snap results
      let associatedBlockId = null;
      let associationType = 'none';
      
      // Use snap results directly for association (much simpler!)
      if (snappedStart) {
        // Arrow starts from a block - associate with that block
        associatedBlockId = snappedStart.blockId;
        associationType = 'start';
      }
      
      // If no block association found, don't create the arrow
      if (!associatedBlockId) {
        console.log('❌ Arrow not associated with any block - cancelling creation');
        this.showNoBlockWarning();
        return;
      }
      
      console.log(`🎯 Arrow ${arrowId} associated with block ${associatedBlockId} (${associationType})`);
      
      // Create arrow line with final (snapped) coordinates
      const arrow = new Konva.Line({
        points: [finalStartX, finalStartY, finalEndX, finalEndY],
        stroke: '#dc3545',
        strokeWidth: 3,
        id: `arrow-${arrowId}`,
        data: { arrowId, type: 'arrow' }
      });

      // Create arrow head with final (snapped) coordinates
      const arrowHead = new Konva.RegularPolygon({
        x: finalEndX,
        y: finalEndY,
        sides: 3,
        radius: 8,
        fill: '#dc3545',
        rotation: Math.atan2(finalEndY - finalStartY, finalEndX - finalStartX) * 180 / Math.PI + 90
      });

      // Create group for arrow
      const arrowGroup = new Konva.Group({
        id: `arrowGroup-${arrowId}`,
        data: { arrowId, type: 'arrow' }
      });
      arrowGroup.add(arrow);
      arrowGroup.add(arrowHead);

      // Add events
      arrowGroup.on('click', () => {
        this.selectShape(arrowGroup);
      });

      arrowGroup.on('contextmenu', (e) => {
        e.evt.preventDefault();
        if (confirm('Delete this arrow?')) {
          this.deleteArrow(arrowId);
        }
      });

      // Add to layer
      this.arrowsLayer.add(arrowGroup);
      
      // Add click event to select arrow
      arrowGroup.on('click', () => {
        console.log('🖱️ Arrow clicked:', arrowId);
        this.selectShape(arrowGroup);
      });
      
      this.stage.batchDraw();

      // Store arrow data with block association (using ORIGINAL image coordinates)
      this.arrows.push({
        id: arrowId,
        group: arrowGroup,
        line: arrow,
        // Store ORIGINAL image coordinates, not scaled display coordinates
        start_x: this.convertToOriginalCoordinates(finalStartX, finalStartY).x,
        start_y: this.convertToOriginalCoordinates(finalStartX, finalStartY).y,
        end_x: this.convertToOriginalCoordinates(finalEndX, finalEndY).x,
        end_y: this.convertToOriginalCoordinates(finalEndX, finalEndY).y,
        associated_block_id: associatedBlockId,
        association_type: associationType
      });
      
      // Add visual indicator for arrow-block association
      if (associatedBlockId) {
        const associatedBlock = this.blocks.find(b => b.id === associatedBlockId);
        if (associatedBlock) {
          // Add a small indicator near the block to show arrow association
          const indicator = new Konva.Circle({
            x: associatedBlock.x + associatedBlock.width + 5,
            y: associatedBlock.y + 5,
            radius: 4,
            fill: '#dc3545',
            stroke: 'white',
            strokeWidth: 1,
            id: `arrow-indicator-${arrowId}`
          });
          
          this.blocksLayer.add(indicator);
          this.stage.batchDraw();
          
          // Store reference to indicator for cleanup
          this.arrows[this.arrows.length - 1].indicator = indicator;
        }
      }
      
      console.log('✅ Arrow created and stored:', this.arrows[this.arrows.length - 1]);
    }

    // Helper method to check if a point is near a block (DEPRECATED - now handled by snapToNearestBlock)
    // Keeping for backward compatibility but no longer used in arrow creation
    isPointNearBlock(x, y, block, tolerance = 60) {
      return x >= block.x - tolerance && 
             x <= block.x + block.width + tolerance && 
             y >= block.y - tolerance && 
             y <= block.y + block.height + tolerance;
    }

    // Helper method to convert scaled display coordinates to original image coordinates
    convertToOriginalCoordinates(displayX, displayY) {
      // Convert from scaled display coordinates to original image coordinates
      const originalX = (displayX - this.imageInfo.x) / this.imageInfo.scale;
      const originalY = (displayY - this.imageInfo.y) / this.imageInfo.scale;
      return { x: originalX, y: originalY };
    }

    // Magnetic snapping method to automatically snap arrows to nearby blocks
    snapToNearestBlock(x, y, snapRadius = 60) {
      let nearestBlock = null;
      let nearestDistance = Infinity;
      let snapPoint = null;
      
      for (const block of this.blocks) {
        const blockCenterX = block.x + (block.width / 2);
        const blockCenterY = block.y + (block.height / 2);
        
        const distance = Math.sqrt(
          Math.pow(x - blockCenterX, 2) + Math.pow(y - blockCenterY, 2)
        );
        
        if (distance <= snapRadius && distance < nearestDistance) {
          nearestDistance = distance;
          nearestBlock = block;
          snapPoint = { 
            x: blockCenterX, 
            y: blockCenterY,
            blockId: nearestBlock.id,
            block: nearestBlock,
            distance: nearestDistance
          };
        }
      }
      
      if (snapPoint) {
        console.log(`🧲 Snapping to block ${nearestBlock.id} at (${snapPoint.x}, ${snapPoint.y})`);
      }
      
      return snapPoint;
    }

    // Validation method to ensure arrows start near blocks
    validateArrowPlacement(startX, startY, endX, endY) {
      let hasValidPlacement = false;
      
      // Arrow is valid if START point is near a block
      for (const block of this.blocks) {
        if (this.isPointNearBlock(startX, startY, block)) {
          hasValidPlacement = true;
          break;
        }
      }
      
      if (!hasValidPlacement) {
        console.log('❌ Arrow start point not near any block - cancelling creation');
        this.showNoBlockWarning();
        return false;
      }
      
      return true;
    }

    // Show warning when arrow can't be created
    showNoBlockWarning() {
      const warning = document.createElement('div');
      warning.style.cssText = `
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
      `;
      warning.textContent = '⚠️ Arrow must start or end near a block';
      
      // Add animation CSS if not already present
      if (!document.getElementById('warningStyles')) {
        const style = document.createElement('style');
        style.id = 'warningStyles';
        style.textContent = `
          @keyframes warningFade {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(warning);
      
      setTimeout(() => {
        if (warning.parentNode) {
          warning.parentNode.removeChild(warning);
        }
      }, 2000);
    }

    deleteArrow(arrowId) {
      // Remove from array
      const arrowIndex = this.arrows.findIndex(a => a.id === arrowId);
      if (arrowIndex !== -1) {
        const arrow = this.arrows[arrowIndex];
        
        // Remove visual indicator if it exists
        if (arrow.indicator) {
          arrow.indicator.destroy();
        }
        
        // Remove from layer
        arrow.group.destroy();
        
        // Remove from array
        this.arrows.splice(arrowIndex, 1);
        
        this.stage.batchDraw();
      }
    }

    createWordsEditor() {
      console.log('📝 Creating words editor...');
      const wordsEditor = this.container.querySelector('#wordsEditor');
      const actionButtonsContainer = this.container.querySelector('#actionButtonsContainer');
      
      if (wordsEditor) {
        wordsEditor.style.display = 'block';
        console.log('✅ Words editor displayed');
      } else {
        console.error('❌ Words editor not found!');
      }
      
      if (actionButtonsContainer) {
        actionButtonsContainer.style.display = 'block';
        console.log('✅ Action buttons container displayed');
      } else {
        console.error('❌ Action buttons container not found!');
      }
      
      this.updateWordsEditor();
    }

    updateWordsEditor() {
      console.log('📝 Updating words editor...');
      const wordsList = this.container.querySelector('#wordsList');
      
      if (!wordsList) {
        console.error('❌ Words list element not found!');
        return;
      }
      
      console.log('📊 Current blocks for words:', this.blocks.length);
      // Snapshot any current inputs to preserve values before re-render
      const existingInputs = wordsList.querySelectorAll('.word-input');
      if (existingInputs && existingInputs.length) {
        existingInputs.forEach((input) => {
          const blockIdAttr = input.getAttribute('data-block-id');
          const blockId = blockIdAttr ? parseInt(blockIdAttr) : null;
          if (!blockId) return;
          const value = input.value || '';
          const existingIdx = this.words.findIndex(w => w.blockId === blockId);
          if (existingIdx >= 0) {
            this.words[existingIdx].word = value;
          } else if (value && value.trim() !== '') {
            this.words.push({ blockId, word: value });
          }
        });
      }

      wordsList.innerHTML = '';
      
      this.blocks.forEach((block, index) => {
        console.log(`📝 Creating word input for block ${block.id}`);
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
          <div class="word-number">${block.id}</div>
          <input type="text" class="word-input" placeholder="Enter word for block ${block.id}" 
                 data-block-id="${block.id}">
        `;
        
        // Auto-save word input
        const wordInput = wordItem.querySelector('.word-input');
        // Restore existing value if present
        const existing = this.words.find(w => w.blockId === block.id);
        if (existing) {
          wordInput.value = existing.word || '';
        }
        wordInput.addEventListener('input', (e) => {
          const blockId = parseInt(e.target.dataset.blockId);
          const word = e.target.value;
          console.log(`📝 Word updated for block ${blockId}: "${word}"`);
          this.updateWord(blockId, word);
        });
        
        wordsList.appendChild(wordItem);
      });
      
      console.log('✅ Words editor updated successfully');
    }

    updateWord(blockId, word) {
      console.log(`📝 Updating word for block ${blockId}: "${word}"`);
      const existingWordIndex = this.words.findIndex(w => w.blockId === blockId);
      if (existingWordIndex >= 0) {
        this.words[existingWordIndex].word = word;
        console.log(`✅ Updated existing word at index ${existingWordIndex}`);
      } else {
        this.words.push({ blockId, word });
        console.log(`✅ Added new word for block ${blockId}`);
      }
      console.log('📊 Current words array:', this.words);
    }

         clearAll() {
       console.log('🗑️ Clear all method called');
       
       // Clear all shapes
       this.blocksLayer.destroyChildren();
       this.arrowsLayer.destroyChildren();
       console.log('✅ Konva layers cleared');
       
       // Clear arrays
       this.blocks = [];
       this.arrows = [];
       this.words = [];
       console.log('✅ Arrays cleared');
       
       // Reset IDs
       this.currentBlockId = 0;
       this.currentArrowId = 0;
       console.log('✅ IDs reset');
       
       // Update words editor
       this.updateWordsEditor();
       
       this.stage.batchDraw();
       console.log('✅ Stage redrawn');
       console.log('✅ Clear all completed');
     }

    async saveTest() {
      console.log('💾 Save test method called');
      console.log('📊 Current blocks:', this.blocks.length);
      console.log('📝 Current words:', this.words.length);
      
      // Validate that each block has a word
      for (const block of this.blocks) {
        const w = this.words.find(x => x.blockId === block.id);
        if (!w || !w.word || !w.word.trim()) {
          console.error('❌ Validation failed: Missing word for block', block.id);
          alert(`Please enter a word for block ${block.id} before saving.`);
          return;
        }
      }
      
      console.log('✅ Validation passed, preparing test data...');
      
      // Prepare test data
      const testData = {
        image_url: this.image,
        num_blocks: this.blocks.length,
        questions: this.blocks.map((block) => {
          const questionData = {
            question_id: block.id,
            word: (this.words.find(w => w.blockId === block.id)?.word) || '',
            block_coordinates: {
              // Absolute coordinates (for backward compatibility)
              x: block.x,
              y: block.y,
              width: block.width,
              height: block.height,
              
              // Relative coordinates (for responsive positioning)
              // Convert scaled display coordinates back to original image coordinates first
              rel_x: this.originalImageWidth ? (((block.x - this.imageInfo.x) / this.imageInfo.scale) / this.originalImageWidth) * 100 : null,
              rel_y: this.originalImageHeight ? (((block.y - this.imageInfo.y) / this.imageInfo.scale) / this.originalImageHeight) * 100 : null,
              rel_width: this.originalImageWidth ? ((block.width / this.imageInfo.scale) / this.originalImageWidth) * 100 : null,
              rel_height: this.originalImageHeight ? ((block.height / this.imageInfo.scale) / this.originalImageHeight) * 100 : null,
              
              // Image dimensions for reference
              image_width: this.originalImageWidth || null,
              image_height: this.originalImageHeight || null
            },
            has_arrow: false
          };
          
          // Find arrows associated with this block using the improved association
          const associatedArrows = this.arrows.filter(arrow => 
            arrow.associated_block_id === block.id
          );
          
          if (associatedArrows.length > 0) {
            questionData.has_arrow = true;
            // Use the first associated arrow (or could combine multiple)
            const primaryArrow = associatedArrows[0];
            questionData.arrow = {
              // Absolute coordinates (for backward compatibility)
              start_x: primaryArrow.start_x,
              start_y: primaryArrow.start_y,
              end_x: primaryArrow.end_x,
              end_y: primaryArrow.end_y,
              
              // Relative coordinates (for responsive positioning)
              // Simple percentage calculation since arrows now store original coordinates
              rel_start_x: (this.originalImageWidth || this.imageInfo?.originalWidth) ? (primaryArrow.start_x / (this.originalImageWidth || this.imageInfo.originalWidth)) * 100 : null,
              rel_start_y: (this.originalImageHeight || this.imageInfo?.originalHeight) ? (primaryArrow.start_y / (this.originalImageHeight || this.imageInfo.originalHeight)) * 100 : null,
              rel_end_x: (this.originalImageWidth || this.imageInfo?.originalWidth) ? (primaryArrow.end_x / (this.originalImageWidth || this.imageInfo.originalWidth)) * 100 : null,
              rel_end_y: (this.originalImageHeight || this.imageInfo?.originalHeight) ? (primaryArrow.end_y / (this.originalImageHeight || this.imageInfo.originalHeight)) * 100 : null,
              
              // Image dimensions for reference
              image_width: this.originalImageWidth || this.imageInfo?.originalWidth || null,
              image_height: this.originalImageHeight || this.imageInfo?.originalHeight || null,
              
              style: { color: '#dc3545', thickness: 3 }
            };
            console.log(`🎯 Block ${block.id} has ${associatedArrows.length} associated arrows`);
          }
          
          return questionData;
        }),
        arrows: this.arrows.map(arrow => ({
          // Absolute coordinates (for backward compatibility)
          start_x: arrow.start_x,
          start_y: arrow.start_y,
          end_x: arrow.end_x,
          end_y: arrow.end_y,
          
          // Relative coordinates (for responsive positioning)
          // Simple percentage calculation since arrows now store original coordinates
          rel_start_x: (this.originalImageWidth || this.imageInfo?.originalWidth) ? (arrow.start_x / (this.originalImageWidth || this.imageInfo.originalWidth)) * 100 : null,
          rel_start_y: (this.originalImageHeight || this.imageInfo?.originalHeight) ? (arrow.start_y / (this.originalImageHeight || this.imageInfo.originalHeight)) * 100 : null,
          rel_end_x: (this.originalImageWidth || this.imageInfo?.originalWidth) ? (arrow.end_x / (this.originalImageWidth || this.imageInfo.originalWidth)) * 100 : null,
          rel_end_y: (this.originalImageHeight || this.imageInfo?.originalHeight) ? (arrow.end_y / (this.originalImageHeight || this.imageInfo.originalHeight)) * 100 : null,
          
          // Image dimensions for reference
          image_width: this.originalImageWidth || this.imageInfo?.originalWidth || null,
          image_height: this.originalImageHeight || this.imageInfo?.originalHeight || null,
          
          arrow_style: { color: '#dc3545', thickness: 3 }
        }))
      };
      
      console.log('📊 Test data prepared:', testData);
      
      // Emit custom event with test data
      const event = new CustomEvent('matchingTestSaved', {
        detail: testData
      });
      this.container.dispatchEvent(event);
      console.log('📡 Custom event dispatched: matchingTestSaved');
      
      alert('Test data prepared! Check the console for the test data structure.');
      console.log('Matching test data:', testData);
    }

      async createTest() {
      // IMMEDIATE FEEDBACK: Show loading state
      this.updateCreateTestButtonState('loading');
      this.showTestCreationLoadingOverlay();
      this.updateLoadingStep('Preparing test data...', 25);

      // Use name from main form; fallback to timestamped default
      const defaultName = `Matching Test — ${new Date().toLocaleString()}`;
      const nameInput = (typeof document !== 'undefined') ? document.getElementById('matchingTestName') : null;
      const testName = (nameInput && nameInput.value && nameInput.value.trim()) ? nameInput.value.trim() : defaultName;

      // Get teacher_id from JWT authentication
      const teacherId = await getCurrentTeacherId();
      if (!teacherId) {
        console.error('No valid teacher session found in createTest, redirecting to login');
        alert('Missing teacher session. Please sign in again.');
        // Redirect to login
        if (typeof showSection === 'function') {
          showSection('login-section');
        } else {
          window.location.href = 'index.html';
        }
        return;
      }

      // Ensure words array mapped by block id
      const questions = this.blocks.map((block) => {
        const w = this.words.find(v => v.blockId === block.id)?.word || '';
        const q = {
          question_id: block.id,
          word: w,
          block_coordinates: {
            // Absolute coordinates (for backward compatibility)
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            
            // Relative coordinates (for responsive positioning)
            // Convert scaled display coordinates back to original image coordinates first
            rel_x: this.originalImageWidth ? (((block.x - this.imageInfo.x) / this.imageInfo.scale) / this.originalImageWidth) * 100 : null,
            rel_y: this.originalImageHeight ? (((block.y - this.imageInfo.y) / this.imageInfo.scale) / this.originalImageHeight) * 100 : null,
            rel_width: this.originalImageWidth ? ((block.width / this.imageInfo.scale) / this.originalImageWidth) * 100 : null,
            rel_height: this.originalImageHeight ? ((block.height / this.imageInfo.scale) / this.originalImageHeight) * 100 : null,
            
            // Image dimensions for reference
            image_width: this.originalImageWidth || null,
            image_height: this.originalImageHeight || null
          },
          has_arrow: false
        };
        
        // Find arrows associated with this block using the improved association
        const associatedArrows = this.arrows.filter(arrow => 
          arrow.associated_block_id === block.id
        );
        
        if (associatedArrows.length > 0) {
          q.has_arrow = true;
          // Use the first associated arrow (or could combine multiple)
          const primaryArrow = associatedArrows[0];
          q.arrow = {
            // Absolute coordinates (for backward compatibility)
            start_x: primaryArrow.start_x,
            start_y: primaryArrow.start_y,
            end_x: primaryArrow.end_x,
            end_y: primaryArrow.end_y,
            
            // Relative coordinates (for responsive positioning)
            // Simple percentage calculation since arrows now store original coordinates
            rel_start_x: (this.originalImageWidth || this.imageInfo?.originalWidth) ? (primaryArrow.start_x / (this.originalImageWidth || this.imageInfo.originalWidth)) * 100 : null,
            rel_start_y: (this.originalImageHeight || this.imageInfo?.originalHeight) ? (primaryArrow.start_y / (this.originalImageHeight || this.imageInfo.originalHeight)) * 100 : null,
            rel_end_x: (this.originalImageWidth || this.imageInfo?.originalWidth) ? (primaryArrow.end_x / (this.originalImageWidth || this.imageInfo.originalWidth)) * 100 : null,
            rel_end_y: (this.originalImageHeight || this.imageInfo?.originalHeight) ? (primaryArrow.end_y / (this.originalImageHeight || this.imageInfo.originalHeight)) * 100 : null,
            
            // Image dimensions for reference
            image_width: this.originalImageWidth || this.imageInfo?.originalWidth || null,
            image_height: this.originalImageHeight || this.imageInfo?.originalHeight || null,
            
            style: { color: '#dc3545', thickness: 3 }
          };
          console.log(`🎯 Block ${block.id} has ${associatedArrows.length} associated arrows`);
        }
        
        return q;
      });

      const payload = {
        teacher_id: teacherId,
        test_name: testName,
        image_url: this.image,
        num_blocks: this.blocks.length,
        questions
      };

      console.log('📦 Sending matching test payload:', payload);

      const uploadIfNeeded = async () => {
        // Image is already uploaded to Cloudinary, just use the URL
        if (this.image && typeof this.image === 'string') {
          payload.image_url = this.image;
          console.log('✅ Using Cloudinary URL for test:', this.image);
        }
        return true;
      };

      uploadIfNeeded().then((ok) => {
        if (!ok) return;
        
        // Update loading state for API call
        this.updateLoadingStep('Saving test to database...', 50);
        
        window.tokenManager.makeAuthenticatedRequest(
          '/.netlify/functions/save-matching-type-test',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          console.error('❌ Save matching test failed:', res.status, data);
          alert('Failed to save matching test.');
          // Reset button state on failure
          this.updateCreateTestButtonState('reset');
          this.hideTestCreationLoadingOverlay();
          return;
        }
        
        console.log('✅ Matching test saved, id:', data.test_id);
        
        // Update loading state for success
        this.updateLoadingStep('Test created successfully! Loading assignment interface...', 100);
        this.updateCreateTestButtonState('success');
        
        // Small delay to show success state
        setTimeout(() => {
          // Clear local draft if any
          if (typeof window.clearTestLocalStorage === 'function') {
            window.clearTestLocalStorage();
          }
          
          // Hide the test creation UI and show assignment interface
          this.hideTestCreationUI();
          showTestAssignment('matching_type', data.test_id);
        }, 1000);
      })
      .catch((error) => {
        console.error('❌ Error saving matching test:', error);
        alert('Error saving matching test. Please try again.');
        // Reset button state on error
        this.updateCreateTestButtonState('reset');
        this.hideTestCreationLoadingOverlay();
      });
      });
    }

    // Hide the test creation interface
    hideTestCreationUI() {
      console.log('🔒 Hiding test creation UI...');
      
      // Hide the main test creation container
      const testCreationContainer = this.container.querySelector('.matching-test-creation');
      if (testCreationContainer) {
        testCreationContainer.style.display = 'none';
      }
      
      // Hide the canvas and controls
      const canvasContainer = this.container.querySelector('.matching-test-canvas-container');
      if (canvasContainer) {
        canvasContainer.style.display = 'none';
      }
      
      // Hide the words panel
      const wordsPanel = this.container.querySelector('.matching-test-words-panel');
      if (wordsPanel) {
        wordsPanel.style.display = 'none';
      }
      
      // Hide the create test button
      const createTestBtn = this.container.querySelector('#createTestBtn');
      if (createTestBtn) {
        createTestBtn.style.display = 'none';
      }
      
      console.log('✅ Test creation UI hidden');
    }















    cancelTestCreation() {
      console.log('❌ Cancel test creation called');
      
      // If no image was uploaded yet, exit test creation entirely (return to main page)
      if (!this.image) {
        try {
          if (typeof window.resetTestCreation === 'function') {
            window.resetTestCreation();
            console.log('✅ No image uploaded — exited test creation and returned to main page');
            return;
          }
        } catch (_) {}
      }

      // Otherwise, reset the widget to initial state
      if (confirm('Are you sure you want to cancel test creation? All progress will be lost.')) {
        console.log('✅ User confirmed cancellation');
        
        // Clear everything
        this.clearAll();
        
        // Hide the editor sections
        const imageEditor = this.container.querySelector('#imageEditor');
        const wordsEditor = this.container.querySelector('#wordsEditor');
        const actionButtonsContainer = this.container.querySelector('#actionButtonsContainer');
        
        if (imageEditor) {
          imageEditor.style.display = 'none';
          console.log('✅ Image editor hidden');
        }
        
        if (wordsEditor) {
          wordsEditor.style.display = 'none';
          console.log('✅ Words editor hidden');
        }
        
        if (actionButtonsContainer) {
          actionButtonsContainer.style.display = 'none';
          console.log('✅ Action buttons hidden');
        }
        
        // Show the image uploader again
        const imageUploader = this.container.querySelector('#imageUploader');
        if (imageUploader) {
          imageUploader.style.display = 'block';
          console.log('✅ Image uploader shown');
        }
        
        // Reset image
        this.image = null;
        this.imageInfo = null;
        
        // Clear image layer
        if (this.imageLayer) {
          this.imageLayer.destroyChildren();
          this.stage.batchDraw();
          console.log('✅ Image layer cleared');
        }
        
        // Hide upload status
        const uploadStatus = this.container.querySelector('#uploadStatus');
        if (uploadStatus) {
          uploadStatus.style.display = 'none';
          console.log('✅ Upload status hidden');
        }
        
        console.log('✅ Test creation cancelled - widget reset to initial state');
      } else {
        console.log('❌ User cancelled the cancellation');
      }
    }

    hideLoadingIndicator() {
      const loadingIndicator = this.container.querySelector('#loadingIndicator');
      const imageUploader = this.container.querySelector('#imageUploader');
      
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      if (imageUploader) {
        imageUploader.style.display = 'block';
      }
    }

    showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
      `;
      
      errorDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
          <span style="font-size: 24px;">⚠️</span>
          <h4 style="margin: 10px 0;">Graphics Library Error</h4>
          <p style="margin: 0; font-weight: normal;">${message}</p>
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
      `;
      
      // Hide loading indicator
      const loadingIndicator = this.container.querySelector('#loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      this.container.appendChild(errorDiv);
    }

    // Debug method to show current widget state
    debugState() {
      console.log('🔍 === WIDGET DEBUG STATE ===');
      console.log('📋 Container:', this.container);
      console.log('🖼️ Image:', this.image);
      console.log('📊 Blocks count:', this.blocks.length);
      console.log('📝 Words count:', this.words.length);
      console.log('➡️ Arrows count:', this.arrows.length);
      console.log('🎨 Stage:', this.stage);
      console.log('🔢 Current block ID:', this.currentBlockId);
      console.log('🔢 Current arrow ID:', this.currentArrowId);
      console.log('🎯 Selected shape:', this.selectedShape);
      console.log('📱 Elements visibility:');
      console.log('  - Loading indicator:', this.container.querySelector('#loadingIndicator')?.style.display);
      console.log('  - Image uploader:', this.container.querySelector('#imageUploader')?.style.display);
      console.log('  - Image editor:', this.container.querySelector('#imageEditor')?.style.display);
      console.log('  - Words editor:', this.container.querySelector('#wordsEditor')?.style.display);
      console.log('  - Action buttons:', this.container.querySelector('#actionButtonsContainer')?.style.display);
      console.log('🔍 === END DEBUG STATE ===');
    }

    // Test method to verify widget functionality
    testWidget() {
      console.log('🧪 === TESTING WIDGET FUNCTIONALITY ===');
      
      // Test 1: Check if Konva is loaded
      if (typeof Konva !== 'undefined') {
        console.log('✅ Konva.js is loaded');
      } else {
        console.error('❌ Konva.js is NOT loaded');
      }
      
      // Test 2: Check if stage exists
      if (this.stage) {
        console.log('✅ Konva stage exists');
      } else {
        console.error('❌ Konva stage does NOT exist');
      }
      
      // Test 3: Check if layers exist
      if (this.blocksLayer && this.arrowsLayer) {
        console.log('✅ Konva layers exist');
      } else {
        console.error('❌ Konva layers do NOT exist');
      }
      
      // Test 4: Check button elements
      const addBlockBtn = this.container.querySelector('#addBlockBtn');
      const createTestBtn = this.container.querySelector('#createTestBtn');
              const cancelBtn = this.container.querySelector('#cancelTestCreationMatching');
      
      if (addBlockBtn) {
        console.log('✅ Add block button exists');
        console.log('  - Display:', addBlockBtn.style.display);
        console.log('  - Visible:', addBlockBtn.offsetParent !== null);
      } else {
        console.error('❌ Add block button does NOT exist');
      }
      
      if (createTestBtn) {
        console.log('✅ Create test button exists');
        console.log('  - Display:', createTestBtn.style.display);
        console.log('  - Visible:', createTestBtn.offsetParent !== null);
      } else {
        console.error('❌ Create test button does NOT exist');
      }
      
      if (cancelBtn) {
        console.log('✅ Cancel button exists');
        console.log('  - Display:', cancelBtn.style.display);
        console.log('  - Visible:', cancelBtn.offsetParent !== null);
      } else {
        console.error('❌ Cancel button does NOT exist');
      }
      
             // Test 5: Check current state
       console.log('📊 Current widget state:');
       console.log('  - Blocks:', this.blocks.length);
       console.log('  - Arrows:', this.arrows.length);
       console.log('  - Words:', this.words.length);
       console.log('  - Image:', this.image ? 'Loaded' : 'Not loaded');
       
       // Test 6: Check block dragging
       if (this.blocks.length > 0) {
         const firstBlock = this.blocks[0];
         console.log('🔧 Testing block dragging:');
         console.log('  - Block group:', firstBlock.group);
         console.log('  - Group draggable:', firstBlock.group.draggable());
         console.log('  - Group position:', { x: firstBlock.group.x(), y: firstBlock.group.y() });
         console.log('  - Rect position:', { x: firstBlock.rect.x(), y: firstBlock.rect.y() });
         
         // Test 7: Check resize functionality
         console.log('🔧 Testing resize functionality:');
         console.log('  - Selected shape:', this.selectedShape);
         console.log('  - Resize direction:', this.resizeDir);
         console.log('  - Resizing flag:', this.resizing);
         console.log('  - Start position:', this.startPos);
         console.log('  - Start rect:', this.startRect);
         
         // Test 8: Simulate edge detection
         if (this.selectedShape) {
           const testPos = { x: firstBlock.x + 5, y: firstBlock.y + 5 }; // Near left edge
           console.log('🔧 Testing edge detection with position:', testPos);
           this.handleEdgeDetection(testPos);
           console.log('🔧 After edge detection - resizeDir:', this.resizeDir);
         }
       }
       
       console.log('🧪 === END TESTING ===');
    }

    // Test method to verify basic Konva functionality
    testKonvaBasics() {
      console.log('🧪 Testing basic Konva functionality...');
      
      if (!this.stage) {
        console.error('❌ Stage not initialized');
        return false;
      }
      
      if (!this.blocksLayer) {
        console.error('❌ Blocks layer not initialized');
        return false;
      }
      
      // Test 1: Create a simple test rectangle
      console.log('🔧 Creating test rectangle...');
      const testRect = new Konva.Rect({
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        fill: 'rgba(0, 255, 0, 0.3)',
        stroke: 'green',
        strokeWidth: 2,
        draggable: true
      });
      
      // Add events to test rectangle
      testRect.on('dragstart', () => console.log('✅ Test rect drag started'));
      testRect.on('dragmove', () => console.log('✅ Test rect drag move'));
      testRect.on('dragend', () => console.log('✅ Test rect drag ended'));
      
      // Add to layer
      this.blocksLayer.add(testRect);
      this.stage.batchDraw();
      
      console.log('✅ Test rectangle created and added');
      console.log('✅ Basic Konva functionality test passed');
      
      return true;
    }

    // Delete selected block
    deleteSelectedBlock() {
      if (!this.selectedShape) {
        console.log('❌ No block selected for deletion');
        return;
      }

      // Find the block data for this shape
      const blockData = this.blocks.find(block => block.group === this.selectedShape);
      if (!blockData) {
        console.log('❌ Block data not found for selected shape');
        return;
      }

      console.log('🗑️ Deleting block:', blockData.id);

      // Remove from Konva layer
      this.selectedShape.destroy();
      
      // Remove from blocks array
      const blockIndex = this.blocks.findIndex(block => block.id === blockData.id);
      if (blockIndex !== -1) {
        this.blocks.splice(blockIndex, 1);
      }

      // Clear selection
      this.selectedShape = null;
      
      // Update words editor
      this.updateWordsEditor();
      
      // Redraw stage
      this.stage.batchDraw();
      
      console.log('✅ Block deleted successfully');
    }

    // Delete selected arrow
    deleteSelectedArrow() {
      if (!this.selectedShape) {
        console.log('❌ No arrow selected for deletion');
        return;
      }

      // Find the arrow data for this shape
      const arrowData = this.arrows.find(arrow => arrow.group === this.selectedShape);
      if (!arrowData) {
        console.log('❌ Arrow data not found for selected shape');
        return;
      }

      console.log('🗑️ Deleting arrow:', arrowData.id);

      // Remove from Konva layer
      this.selectedShape.destroy();
      
      // Remove from arrows array
      const arrowIndex = this.arrows.findIndex(arrow => arrow.id === arrowData.id);
      if (arrowIndex !== -1) {
        this.arrows.splice(arrowIndex, 1);
      }

      // Clear selection
      this.selectedShape = null;
      
      // Redraw stage
      this.stage.batchDraw();
      
      console.log('✅ Arrow deleted successfully');
    }

    // Cleanup method to remove event listeners
    cleanup() {
      if (this.documentMouseMoveHandler) {
        document.removeEventListener('mousemove', this.documentMouseMoveHandler);
        this.documentMouseMoveHandler = null;
      }
      
      if (this.handleResize) {
        window.removeEventListener('resize', this.handleResize);
        this.handleResize = null;
      }
      
      if (this.stage) {
        this.stage.destroy();
        this.stage = null;
      }
    }

         // Detect if mouse is near a block's border or corner for editing

    // Reset image and clear all content
    resetImage() {
      console.log('🔄 Resetting image and clearing all content');
      
      // Clear all blocks and arrows
      this.clearAll();
      
      // Hide image editor
      const imageEditor = document.getElementById('imageEditor');
      if (imageEditor) {
        imageEditor.style.display = 'none';
      }
      
      // Show image uploader
      const imageUploader = document.getElementById('imageUploader');
      if (imageUploader) {
        imageUploader.style.display = 'block';
      }
      
      // Hide words editor and action buttons
      const wordsEditor = document.getElementById('wordsEditor');
      const actionButtonsContainer = document.getElementById('actionButtonsContainer');
      if (wordsEditor) wordsEditor.style.display = 'none';
      if (actionButtonsContainer) actionButtonsContainer.style.display = 'none';
      
      // Clear uploaded image
      const uploadedImage = document.getElementById('uploadedImage');
      if (uploadedImage) {
        uploadedImage.src = '';
        uploadedImage.style.display = 'none';
      }
      
      // Reset image URL
      this.imageUrl = null;
      
      console.log('✅ Image reset complete');
    }

    // Helper method to update create test button state safely
    updateCreateTestButtonState(state) {
      const createTestBtn = this.container.querySelector('#createTestBtn');
      if (!createTestBtn) return;
      
      switch(state) {
        case 'loading':
          createTestBtn.textContent = 'Creating Test...';
          createTestBtn.disabled = true;
          createTestBtn.classList.remove('btn-success');
          createTestBtn.classList.add('btn-secondary');
          break;
        case 'success':
          createTestBtn.textContent = 'Test Created!';
          createTestBtn.disabled = true;
          createTestBtn.classList.remove('btn-secondary');
          createTestBtn.classList.add('btn-success');
          break;
        case 'reset':
          createTestBtn.textContent = 'Create Test';
          createTestBtn.disabled = false;
          createTestBtn.classList.remove('btn-secondary');
          createTestBtn.classList.add('btn-success');
          break;
      }
    }

    // Helper method to show loading overlay during test creation
    showTestCreationLoadingOverlay() {
      // Create overlay if it doesn't exist
      let overlay = this.container.querySelector('#testCreationLoadingOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'testCreationLoadingOverlay';
        overlay.className = 'test-creation-loading-overlay';
        overlay.innerHTML = `
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <h3>Creating Your Test</h3>
            <p id="loadingStep">Preparing test data...</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        `;
        this.container.appendChild(overlay);
      }
      
      overlay.style.display = 'flex';
    }

    // Helper method to hide loading overlay
    hideTestCreationLoadingOverlay() {
      const overlay = this.container.querySelector('#testCreationLoadingOverlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    }

    // Helper method to update loading step and progress
    updateLoadingStep(step, progress) {
      const stepElement = this.container.querySelector('#loadingStep');
      const progressFill = this.container.querySelector('.progress-fill');
      
      if (stepElement) {
        stepElement.textContent = step;
      }
      
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
    }
  }

  // Export the widget class
  window.MatchingTestWidget = MatchingTestWidget;
  
  // Add debug method to window for easy access
  window.debugMatchingTestWidget = function(containerId) {
    const container = document.getElementById(containerId);
    if (container && container._matchingTestWidget) {
      container._matchingTestWidget.debugState();
    } else {
      console.log('🔍 No matching test widget found in container:', containerId);
    }
  };
  
  // Add test method to window for easy access
  window.testMatchingTestWidget = function(containerId) {
    const container = document.getElementById(containerId);
    if (container && container._matchingTestWidget) {
      container._matchingTestWidget.testWidget();
    } else {
      console.log('🧪 No matching test widget found in container:', containerId);
    }
  };
  
  // Auto-initialize if container is provided
  if (typeof window.initMatchingTestWidget === 'undefined') {
    window.initMatchingTestWidget = async function(containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        try {
          const widget = new MatchingTestWidget(container);
          // Store reference for debugging
          container._matchingTestWidget = widget;
          console.log('🔗 Widget reference stored in container for debugging');
          
          // Wait for initialization to complete
          await new Promise(resolve => {
            const checkInit = setInterval(() => {
              if (widget.stage) {
                clearInterval(checkInit);
                resolve();
              }
            }, 100);
          });
          return widget;
        } catch (error) {
          console.error('Failed to initialize widget:', error);
          return null;
        }
      }
      return null;
    };
  }
})();
