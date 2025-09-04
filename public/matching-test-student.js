/**
 * Matching Type Test - Student Interface
 * Complete implementation with Konva.js, drag-and-drop, and arrow support
 */

class MatchingTestStudent {
  constructor() {
    this.testData = null;
    this.stage = null;
    this.layers = {};
    this.blocks = [];
    this.arrows = [];
    this.words = [];
    this.placedWords = {};
    this.correctMatches = 0;
    this.totalWords = 0;
    this.totalArrows = 0;
    this.arrowCompliance = 0;
    this.isComplete = false;
    this.canSubmit = false;
    
    // DOM elements
    this.elements = {};
    
    // Initialize the test
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Matching Test Student Interface...');
    
    // Get test ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('test_id');
    
    if (!testId) {
      this.showError('No test ID provided. Please check the test link.');
      return;
    }
    
    // Initialize DOM elements
    this.initializeElements();
    
    // Load test data
    await this.loadTestData(testId);
    
    // Initialize Konva.js
    this.initializeKonva();
    
    // Render test content
    this.renderTest();
    
    // Bind events
    this.bindEvents();
    

    
    console.log('✅ Matching Test Student Interface initialized successfully');
  }

  initializeElements() {
    // Cache DOM elements for better performance
    this.elements = {
      backBtn: document.getElementById('backBtn'),
      testTitle: document.getElementById('testTitle'),
      testId: document.getElementById('testId'),
      canvas: document.getElementById('matchingCanvas'),
      canvasOverlay: document.getElementById('canvasOverlay'),
      canvasLoading: document.getElementById('canvasLoading'),
      wordsGrid: document.getElementById('wordsGrid'),
      wordsCount: document.getElementById('wordsCount'),
      // Arrow legend elements removed
      progressFill: document.getElementById('progressFill'),
      progressText: document.getElementById('progressText'),
      resetBtn: document.getElementById('resetBtn'),
      submitBtn: document.getElementById('submitBtn'),
      finalScore: document.getElementById('finalScore'),
      correctMatches: document.getElementById('correctMatches'),
      // Arrow compliance elements removed
      scoreFeedback: document.getElementById('scoreFeedback'),
      // Section elements for hiding/showing
      header: document.querySelector('.matching-test__header'),
      topControls: document.querySelector('.matching-test__top-controls'),
      progressSection: document.querySelector('.matching-test__progress-section'),
      canvasSection: document.querySelector('.matching-test__canvas-section'),
      wordsSection: document.querySelector('.matching-test__words-section'),
      controls: document.querySelector('.matching-test__controls'),
      // Modal elements
      modalOverlay: document.getElementById('modalOverlay'),
      backToCabinetModal: document.getElementById('backToCabinetModal'),
      resetModal: document.getElementById('resetModal'),
      backToCabinetCancel: document.getElementById('backToCabinetCancel'),
      backToCabinetConfirm: document.getElementById('backToCabinetConfirm'),
      resetCancel: document.getElementById('resetCancel'),
      resetConfirm: document.getElementById('resetConfirm'),
      // New elements for results page
      resultsSection: document.getElementById('resultsSection'),
      backToCabinetFromResults: document.getElementById('backToCabinetFromResults')
    };
    
    // Initialize safe loading manager
    this.initializeLoadingManager();
    
    // Validate critical elements exist
    this.validateCriticalElements();
  }

  // Safe Loading Manager with GSAP fallback
  initializeLoadingManager() {
    this.gsapAvailable = false;
    this.checkGSAPAvailability();
  }

  // Validate critical elements exist
  validateCriticalElements() {
    const criticalElements = ['canvas', 'canvasOverlay', 'wordsGrid'];
    const missingElements = [];
    
    criticalElements.forEach(elementKey => {
      if (!this.elements[elementKey]) {
        missingElements.push(elementKey);
      }
    });
    
    if (missingElements.length > 0) {
      console.error('❌ Critical elements missing:', missingElements);
    } else {
      console.log('✅ All critical elements found');
    }
  }

  checkGSAPAvailability() {
    // Check if GSAP is available
    if (window.gsap && window.GSAPAnimations) {
      this.gsapAvailable = true;
      console.log('✅ GSAP animations available');
    } else {
      console.warn('⚠️ GSAP not available, using fallback animations');
    }
  }

  showLoading(message = 'Connecting...') {
    const status = document.getElementById('loadingStatus');
    if (status) status.textContent = message;
    
    if (this.gsapAvailable) {
      // Use GSAP animations
      try {
        window.GSAPAnimations.animateLoading(this.elements.canvasOverlay);
      } catch (error) {
        console.warn('⚠️ GSAP animation failed, using fallback:', error);
        this.useFallbackAnimation();
      }
    } else {
      // Use fallback animations
      this.useFallbackAnimation();
    }
    
    this.elements.canvasOverlay.style.display = 'flex';
  }

  hideLoading() {
    if (this.gsapAvailable) {
      // Use GSAP animations
      try {
        window.GSAPAnimations.stopLoading(this.elements.canvasOverlay);
      } catch (error) {
        console.warn('⚠️ GSAP animation failed, using fallback:', error);
        this.useFallbackReset();
      }
    } else {
      // Use fallback animations
      this.useFallbackReset();
    }
    
    this.elements.canvasOverlay.style.display = 'none';
  }

  useFallbackAnimation() {
    // Simple CSS fallback for loading state
    this.elements.canvasOverlay.style.opacity = '0.6';
    this.elements.canvasOverlay.style.transform = 'scale(0.98)';
    this.elements.canvasOverlay.style.transition = 'all 0.3s ease';
  }

  useFallbackReset() {
    // Reset to normal state
    this.elements.canvasOverlay.style.opacity = '1';
    this.elements.canvasOverlay.style.transform = 'scale(1)';
  }

  async loadTestData(testId) {
    try {
      console.log('📡 Loading test data for ID:', testId);
      
      // Check authentication before making request
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Show loading with status updates
      this.showLoading('Connecting to server...');
      
      const response = await window.tokenManager.makeAuthenticatedRequest(
        `/.netlify/functions/get-matching-type-test?test_id=${testId}`
      );
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load test data');
      }
      
      this.testData = result.data;
      console.log('✅ Test data loaded successfully:', this.testData);
      
      // Update loading status
      this.showLoading('Loading test data...');
      
      // Update UI with test information
      this.elements.testTitle.textContent = this.testData.test_name;
      this.elements.testId.textContent = `Test ID: ${this.testData.test_id}`;
      
      // Process questions and arrows
      this.processTestData();
      
      // Hide loading
      this.hideLoading();
      
    } catch (error) {
      console.error('❌ Error loading test data:', error);
      this.hideLoading();
      this.showError(`Failed to load test: ${error.message}`);
    }
  }

  processTestData() {
    // Process questions into blocks and words
    this.blocks = this.testData.questions.map(q => {
      // Parse block_coordinates if it's a string
      let coordinates;
      try {
        coordinates = typeof q.block_coordinates === 'string' 
          ? JSON.parse(q.block_coordinates) 
          : q.block_coordinates;
      } catch (error) {
        console.error('❌ Error parsing block coordinates:', error);
        coordinates = { x: 0, y: 0, width: 100, height: 100 }; // Fallback
      }
      
      return {
        id: q.question_id,
        word: q.word,
        coordinates: coordinates,
        hasArrow: q.has_arrow,
        arrow: q.arrow
      };
    });
    
    // ✅ ENHANCED: Process arrows with complete coordinate systems
    this.arrows = [];
    
    // Check if arrows are in the main test data
    if (this.testData.arrows && Array.isArray(this.testData.arrows)) {
      this.arrows = this.testData.arrows.map(a => ({
        id: a.id,
        questionId: a.question_id,
        blockId: a.block_id,
        
        // ✅ CORRECTED: Process flat properties from backend
        start: { 
          x: Number(a.start_x) || 0,
          y: Number(a.start_y) || 0
        },
        end: { 
          x: Number(a.end_x) || 0,
          y: Number(a.end_y) || 0
        },
        
        // ✅ NEW: Add relative coordinates for responsive positioning
        rel_start_x: a.rel_start_x !== null ? Number(a.rel_start_x) : null,
        rel_start_y: a.rel_start_y !== null ? Number(a.rel_start_y) : null,
        rel_end_x: a.rel_end_x !== null ? Number(a.rel_end_x) : null,
        rel_end_y: a.rel_end_y !== null ? Number(a.rel_end_y) : null,
        
        // ✅ NEW: Add image dimensions for accurate scaling
        image_width: a.image_width ? Number(a.image_width) : null,
        image_height: a.image_height ? Number(a.image_height) : null,
        
        // ✅ ENHANCED: Parse arrow style from JSONB
        style: (typeof a.style === 'string' ? 
                JSON.parse(a.style) : 
                a.style) || { color: '#dc3545', thickness: 3 }
      }));
    }
    
    // ✅ ENHANCED: Also check if arrows are embedded in questions
    this.testData.questions.forEach(q => {
      if (q.arrows && Array.isArray(q.arrows)) {
        q.arrows.forEach(arrow => {
          this.arrows.push({
            id: arrow.id,
            questionId: arrow.question_id,
            blockId: arrow.block_id,
            
            // ✅ CORRECTED: Process flat properties
            start: { 
              x: Number(arrow.start_x) || 0,
              y: Number(arrow.start_y) || 0
            },
            end: { 
              x: Number(arrow.end_x) || 0,
              y: Number(arrow.end_y) || 0
            },
            
            // ✅ NEW: Add relative coordinates
            rel_start_x: arrow.rel_start_x !== null ? Number(arrow.rel_start_x) : null,
            rel_start_y: arrow.rel_start_y !== null ? Number(arrow.rel_start_y) : null,
            rel_end_x: arrow.rel_end_x !== null ? Number(arrow.rel_end_x) : null,
            rel_end_y: arrow.rel_end_y !== null ? Number(arrow.rel_end_y) : null,
            
            // ✅ NEW: Add image dimensions
            image_width: arrow.image_width ? Number(arrow.image_width) : null,
            image_height: arrow.image_height ? Number(arrow.image_height) : null,
            
            style: arrow.style || { color: '#dc3545', thickness: 3 }
          });
        });
      }
      
      // ✅ ENHANCED: Legacy support for embedded arrows
      if (q.has_arrow && q.arrow) {
        const arrowData = q.arrow;
        this.arrows.push({
          id: `embedded_${q.question_id}`,
          questionId: q.question_id,
          blockId: q.question_id,
          
          // ✅ CORRECTED: Process flat properties
          start: { 
            x: Number(arrowData.start_x) || 0,
            y: Number(arrowData.start_y) || 0
          },
          end: { 
            x: Number(arrowData.end_x) || 0,
            y: Number(arrowData.end_y) || 0
          },
          
          // ✅ NEW: Add relative coordinates if available
          rel_start_x: arrowData.rel_start_x !== null ? Number(arrowData.rel_start_x) : null,
          rel_start_y: arrowData.rel_start_y !== null ? Number(arrowData.rel_start_y) : null,
          rel_end_x: arrowData.rel_end_x !== null ? Number(arrowData.rel_end_x) : null,
          rel_end_y: arrowData.rel_end_y !== null ? Number(arrowData.rel_end_y) : null,
          
          // ✅ NEW: Add image dimensions if available
          image_width: arrowData.image_width ? Number(arrowData.image_width) : null,
          image_height: arrowData.image_height ? Number(arrowData.image_height) : null,
          
          style: arrowData.style || { color: '#dc3545', thickness: 3 }
        });
      }
    });
    
    console.log('✅ Enhanced arrows processed:', this.arrows.length);
    
    // Create words array
    this.words = this.blocks.map(block => ({
      id: block.id,
      word: block.word,
      blockId: null, // Will be set when word is placed
      isPlaced: false,
      isCorrect: false
    }));
    
    this.totalWords = this.words.length;
    this.totalArrows = this.arrows.length;
    
    console.log('📊 Processed test data:', {
      blocks: this.blocks.length,
      arrows: this.arrows.length,
      words: this.words.length
    });
    
    // Debug: Log first block coordinates
    if (this.blocks.length > 0) {
      console.log('🔍 First block coordinates:', this.blocks[0].coordinates);
    }
    
    // Debug: Log arrow data
    if (this.arrows.length > 0) {
      console.log('🎯 First arrow data:', this.arrows[0]);
    } else {
      console.log('ℹ️ No arrows found in test data');
      console.log('🔍 Test data structure:', this.testData);
    }
  }

  initializeKonva() {
    if (!this.elements.canvas) {
      console.error('❌ Canvas element not found');
      return;
    }
    
    console.log('🎨 Initializing Konva.js...');
    
    // Get the actual dimensions of the canvas container
    const containerWidth = this.elements.canvas.offsetWidth;
    const containerHeight = this.elements.canvas.offsetHeight;
    
    console.log('🔍 Canvas container dimensions:', {
      width: containerWidth,
      height: containerHeight
    });
    
    // Create stage with container dimensions
    this.stage = new Konva.Stage({
      container: this.elements.canvas,
      width: containerWidth,
      height: containerHeight
    });
    
    // Create optimized layers (reduced from 6 to 4)
    this.layers = {
      background: new Konva.Layer(), // Background and image
      content: new Konva.Layer(),    // Blocks, arrows, and drop zones
      overlay: new Konva.Layer()     // Visual feedback and highlights
    };
    
    // Add layers to stage
    Object.values(this.layers).forEach(layer => {
      this.stage.add(layer);
    });
    
    // Load image (blocks and arrows will be rendered after image loads)
    this.loadImage();
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('✅ Konva.js initialized successfully');
  }

  async loadImage() {
    if (!this.testData.image_url) {
      console.warn('⚠️ No image URL provided');
      return;
    }
    
    try {
      console.log('🖼️ Loading test image...');
      console.log('🔍 Image URL:', this.testData.image_url);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Add error handling for blob URLs
      img.onerror = (error) => {
        console.error('❌ Failed to load image:', error);
        console.warn('⚠️ This might be due to blob URL restrictions when testing locally');
        
        // Clear timeout if it exists
        if (imageLoadTimeout) {
          clearTimeout(imageLoadTimeout);
        }
        
        // Log error but don't show user-facing error for blob URL issues
        // User will see loading state continues, which is better UX
      };
      
      img.onload = () => {
        console.log('✅ Image loaded successfully');
        
        // Store original image dimensions
        this.originalImageWidth = img.width;
        this.originalImageHeight = img.height;
        
        // Calculate image dimensions to fit canvas without cutting off
        const canvasWidth = this.stage.width();
        const canvasHeight = this.stage.height();
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let imgWidth, imgHeight, imgX, imgY;
        
        // Ensure image fits completely within canvas bounds
        if (imgAspectRatio > canvasAspectRatio) {
          // Image is wider than canvas - fit to width
          imgWidth = Math.min(canvasWidth * 0.95, img.width);
          imgHeight = imgWidth / imgAspectRatio;
          imgX = (canvasWidth - imgWidth) / 2;
          imgY = (canvasHeight - imgHeight) / 2;
        } else {
          // Image is taller than canvas - fit to height
          imgHeight = Math.min(canvasHeight * 0.95, img.height);
          imgWidth = imgHeight * imgAspectRatio;
          imgX = (canvasWidth - imgWidth) / 2;
          imgY = (canvasHeight - imgHeight) / 2;
        }
        
        // Ensure image doesn't exceed canvas bounds
        if (imgWidth > canvasWidth) {
          imgWidth = canvasWidth * 0.95;
          imgHeight = imgWidth / imgAspectRatio;
          imgX = (canvasWidth - imgWidth) / 2;
          imgY = (canvasHeight - imgHeight) / 2;
        }
        
        if (imgHeight > canvasHeight) {
          imgHeight = canvasHeight * 0.95;
          imgWidth = imgHeight * imgAspectRatio;
          imgX = (canvasWidth - imgWidth) / 2;
          imgY = (canvasHeight - imgHeight) / 2;
        }
        
        console.log('🔍 Canvas dimensions:', { width: canvasWidth, height: canvasHeight });
        console.log('🔍 Image dimensions:', { width: imgWidth, height: imgHeight });
        console.log('🔍 Image position:', { x: imgX, y: imgY });
        
        // Create Konva image
        const konvaImage = new Konva.Image({
          x: imgX,
          y: imgY,
          image: img,
          width: imgWidth,
          height: imgHeight
        });
        
        // Clear previous image
        this.layers.background.destroyChildren();
        this.layers.background.add(konvaImage);
        
        // Store image info for coordinate calculations
        this.imageInfo = {
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
          scaleX: imgWidth / img.width,
          scaleY: imgHeight / img.height
        };
        
        console.log('🔍 Image info stored:', this.imageInfo);
        
        // Now render blocks and arrows with correct coordinates
        this.renderBlocks();
        this.renderArrows();
      };
      
      // Set a timeout to handle cases where image loading hangs
      const imageLoadTimeout = setTimeout(() => {
        console.warn('⚠️ Image loading timeout - this might be a blob URL issue');
        clearTimeout(imageLoadTimeout);
        img.onerror(new Error('Image loading timeout'));
      }, 15000); // 15 second timeout for better reliability
      
      img.src = this.testData.image_url;
      
    } catch (error) {
      console.error('❌ Error loading image:', error);
      this.showError('Failed to load test image');
    }
  }



  renderBlocks() {
    console.log('🔲 Rendering blocks...');
    
    if (!this.imageInfo) {
      console.warn('⚠️ Image info not available, cannot render blocks');
      return;
    }
    
    console.log('🔍 Image info for coordinate calculation:', this.imageInfo);
    console.log('🔍 Original image dimensions:', {
      width: this.originalImageWidth,
      height: this.originalImageHeight
    });
    
    // Debug: Log the first block coordinates to understand the data structure
    if (this.blocks.length > 0) {
      const firstBlock = this.blocks[0];
      console.log('🔍 First block raw data:', firstBlock);
      console.log('🔍 First block coordinates type:', typeof firstBlock.coordinates);
      console.log('🔍 First block coordinates value:', firstBlock.coordinates);
      
      // Check if coordinates is a string that needs parsing
      if (typeof firstBlock.coordinates === 'string') {
        try {
          const parsed = JSON.parse(firstBlock.coordinates);
          console.log('🔍 Parsed coordinates:', parsed);
        } catch (e) {
          console.error('❌ Failed to parse coordinates:', e);
        }
      }
    }
    
    this.blocks.forEach(block => {
      console.log(`🔍 Block ${block.id} original coordinates:`, block.coordinates);
      
      // Ensure coordinates are properly parsed
      let coordinates = block.coordinates;
      if (typeof coordinates === 'string') {
        try {
          coordinates = JSON.parse(coordinates);
          console.log(`🔍 Block ${block.id} parsed coordinates:`, coordinates);
        } catch (e) {
          console.error(`❌ Failed to parse coordinates for block ${block.id}:`, e);
          return; // Skip this block if coordinates can't be parsed
        }
      }
      
      // Validate coordinate structure
      if (!coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number' || 
          typeof coordinates.width !== 'number' || typeof coordinates.height !== 'number') {
        console.error(`❌ Invalid coordinates structure for block ${block.id}:`, coordinates);
        return; // Skip this block if coordinates are invalid
      }
      
      // Calculate block position using relative coordinates if available, fallback to absolute
      let blockX, blockY, blockWidth, blockHeight;
      
      if (coordinates.rel_x !== null && coordinates.rel_y !== null && 
          coordinates.rel_width !== null && coordinates.rel_height !== null &&
          coordinates.image_width && coordinates.image_height) {
        // Use relative coordinates for responsive positioning
        console.log(`🔲 Block ${block.id} using relative coordinates:`, {
          rel_x: coordinates.rel_x,
          rel_y: coordinates.rel_y,
          rel_width: coordinates.rel_width,
          rel_height: coordinates.rel_height,
          image_width: coordinates.image_width,
          image_height: coordinates.image_height
        });
        
        // Calculate position based on current image size
        // Use the original image dimensions from coordinates for accurate scaling
        const originalWidth = coordinates.image_width;
        const originalHeight = coordinates.image_height;
        
        // Calculate scale factors between original and displayed image
        const scaleX = this.imageInfo.width / originalWidth;
        const scaleY = this.imageInfo.height / originalHeight;
        
        // Apply relative coordinates to the original image dimensions, then scale to display
        blockX = this.imageInfo.x + (coordinates.rel_x / 100) * originalWidth * scaleX;
        blockY = this.imageInfo.y + (coordinates.rel_y / 100) * originalHeight * scaleY;
        blockWidth = (coordinates.rel_width / 100) * originalWidth * scaleX;
        blockHeight = (coordinates.rel_height / 100) * originalHeight * scaleY;
        
        console.log(`🔲 Block ${block.id} relative positioning:`, {
          rel_x: coordinates.rel_x, rel_y: coordinates.rel_y,
          calculated: { x: blockX, y: blockY, width: blockWidth, height: blockHeight }
        });
      } else {
        // Fallback to absolute coordinates (backward compatibility)
        console.log(`🔲 Block ${block.id} using absolute coordinates (fallback):`, {
          x: coordinates.x, y: coordinates.y,
          width: coordinates.width, height: coordinates.height
        });
        
        blockX = this.imageInfo.x + (coordinates.x * this.imageInfo.scaleX);
        blockY = this.imageInfo.y + (coordinates.y * this.imageInfo.scaleY);
        blockWidth = coordinates.width * this.imageInfo.scaleX;
        blockHeight = coordinates.height * this.imageInfo.scaleY;
      }
      
      console.log(`🔲 Block ${block.id} calculated position:`, {
        x: blockX,
        y: blockY,
        width: blockWidth,
        height: blockHeight,
        original: coordinates,
        imageInfo: this.imageInfo,
        scaleFactors: {
          scaleX: this.imageInfo.scaleX,
          scaleY: this.imageInfo.scaleY
        },
        calculation: {
          baseX: this.imageInfo.x,
          baseY: this.imageInfo.y,
          scaledX: coordinates.x * this.imageInfo.scaleX,
          scaledY: coordinates.y * this.imageInfo.scaleY,
          scaledWidth: coordinates.width * this.imageInfo.scaleX,
          scaledHeight: coordinates.height * this.imageInfo.scaleY
        }
      });
      
      // Check if block extends beyond image bounds and adjust if necessary
      const imageBounds = {
        left: this.imageInfo.x,
        top: this.imageInfo.y,
        right: this.imageInfo.x + this.imageInfo.width,
        bottom: this.imageInfo.y + this.imageInfo.height
      };
      
      const blockBounds = {
        left: blockX,
        top: blockY,
        right: blockX + blockWidth,
        bottom: blockY + blockHeight
      };
      
      let adjustedX = blockX;
      let adjustedY = blockY;
      let adjustedWidth = blockWidth;
      let adjustedHeight = blockHeight;
      
      // Adjust if block extends beyond image bounds
      if (blockBounds.right > imageBounds.right) {
        adjustedWidth = imageBounds.right - blockX;
        console.log(`⚠️ Block ${block.id} extends beyond image bounds!`);
        console.log(`⚠️ Block bounds:`, blockBounds);
        console.log(`⚠️ Image bounds:`, imageBounds);
        console.log(`🔧 Block ${block.id} adjusted position:`, {
          x: adjustedX,
          y: adjustedY,
          width: adjustedWidth,
          height: adjustedHeight
        });
      }
      
      if (blockBounds.bottom > imageBounds.bottom) {
        adjustedHeight = imageBounds.bottom - blockY;
      }
      
                    // Create Konva block (visual representation only - no correct answer text)
        const konvaBlock = new Konva.Rect({
          x: adjustedX,
          y: adjustedY,
          width: adjustedWidth,
          height: adjustedHeight,
          stroke: 'transparent',
          strokeWidth: 0,
          fill: 'transparent',
          id: `block_${block.id}`,
          data: { blockId: block.id, type: 'block' }
        });
      
             // Add to content layer
       this.layers.content.add(konvaBlock);
      
      // Create HTML drop zone for drag and drop
      this.createHtmlDropZone(block, adjustedX, adjustedY, adjustedWidth, adjustedHeight);
    });
    
    console.log(`✅ Rendered ${this.blocks.length} blocks`);
  }

  renderArrows() {
    // Safety check: ensure arrows array exists before processing
    if (!this.arrows || !Array.isArray(this.arrows)) {
      console.warn('⚠️ No arrows to process');
      return;
    }
    
    if (this.arrows.length === 0) {
      console.log('ℹ️ No arrows to render');
      return;
    }
    
    console.log('➡️ Rendering arrows with unified scaling...');
    
    this.arrows.forEach(arrow => {
      // ✅ ENHANCED: Validate the processed data structure
      if (!arrow || !arrow.id) {
        console.warn('⚠️ Invalid arrow object:', arrow);
        return;
      }
      
      if (!arrow.start || !arrow.end || 
          typeof arrow.start.x !== 'number' || typeof arrow.start.y !== 'number' ||
          typeof arrow.end.x !== 'number' || typeof arrow.end.y !== 'number') {
        console.warn(`⚠️ Invalid arrow data for arrow ${arrow.id}:`, arrow);
        return;
      }
      
      // ✅ UNIFIED: Use same scaling logic as blocks for perfect alignment
      let startX, startY, endX, endY;
      
      // ✅ PRIORITY 1: Relative coordinates with image dimensions (same as blocks)
      if (arrow.rel_start_x !== null && arrow.rel_start_y !== null && 
          arrow.rel_end_x !== null && arrow.rel_end_y !== null &&
          arrow.image_width && arrow.image_height &&
          arrow.image_width > 0 && arrow.image_height > 0) {
        
        // ✅ UNIFIED: Same calculation as blocks for perfect alignment
        const originalWidth = arrow.image_width;
        const originalHeight = arrow.image_height;
        
        // ✅ UNIFIED: Same scale factors as blocks
        const scaleX = this.imageInfo.width / originalWidth;
        const scaleY = this.imageInfo.height / originalHeight;
        
        // ✅ UNIFIED: Same positioning math as blocks
        startX = this.imageInfo.x + (arrow.rel_start_x / 100) * originalWidth * scaleX;
        startY = this.imageInfo.y + (arrow.rel_start_y / 100) * originalHeight * scaleY;
        endX = this.imageInfo.x + (arrow.rel_end_x / 100) * originalWidth * scaleX;
        endY = this.imageInfo.y + (arrow.rel_end_y / 100) * originalHeight * scaleY;
        
        console.log(`✅ Arrow ${arrow.id} using unified relative coordinates:`, {
          rel_start: { x: arrow.rel_start_x, y: arrow.rel_start_y },
          rel_end: { x: arrow.rel_end_x, y: arrow.rel_end_y },
          original_dimensions: { width: originalWidth, height: originalHeight },
          scale_factors: { scaleX, scaleY },
          calculated: { start: { x: startX, y: startY }, end: { x: endX, y: endY } }
        });
        
      } else if (arrow.start && arrow.end) {
        // ✅ PRIORITY 2: Absolute coordinates with scaling (fallback, same as blocks)
        console.log(`✅ Arrow ${arrow.id} using absolute coordinates (fallback):`, {
          start: arrow.start, end: arrow.end
        });
        
        // ✅ UNIFIED: Same scaling logic as blocks
        startX = this.imageInfo.x + (arrow.start.x * this.imageInfo.scaleX);
        startY = this.imageInfo.y + (arrow.start.y * this.imageInfo.scaleY);
        endX = this.imageInfo.x + (arrow.end.x * this.imageInfo.scaleX);
        endY = this.imageInfo.y + (arrow.end.y * this.imageInfo.scaleY);
        
      } else {
        console.warn(`⚠️ Arrow ${arrow.id} has no valid coordinates, skipping`);
        return;
      }
      
      // ✅ VALIDATION: Ensure coordinates are within reasonable bounds
      const maxCoordinate = Math.max(
        Math.abs(startX), Math.abs(startY),
        Math.abs(endX), Math.abs(endY)
      );
      
      if (maxCoordinate > 10000) {
        console.warn(`⚠️ Arrow ${arrow.id} has suspiciously large coordinates:`, maxCoordinate);
        return; // Skip this arrow
      }
      
      console.log(`✅ Arrow ${arrow.id} final coordinates:`, {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        imageInfo: this.imageInfo
      });
      
      // Create arrow line
      const arrowLine = new Konva.Arrow({
        points: [startX, startY, endX, endY],
        stroke: arrow.style.color || '#dc3545',
        strokeWidth: arrow.style.thickness || 3,
        fill: arrow.style.color || '#dc3545',
        pointerLength: arrow.style.pointerLength || 10,
        pointerWidth: arrow.style.pointerWidth || 10,
        dash: arrow.style.style === 'dashed' ? [5, 5] : [],
        opacity: arrow.style.opacity || 1,
        id: `arrow_${arrow.id}`,
        data: { arrowId: arrow.id, type: 'arrow' }
      });
      
      // Add to content layer
      this.layers.content.add(arrowLine);
    });
    
    console.log(`✅ Rendered ${this.arrows.length} arrows with unified scaling`);
    
    // Arrow legend removed - no longer needed
  }

  createHtmlDropZone(block, blockX, blockY, blockWidth, blockHeight) {
    const dropZone = document.createElement('div');
    dropZone.className = 'matching-test__drop-zone';
    dropZone.id = `dropZone_${block.id}`;
    dropZone.dataset.blockId = block.id;
    dropZone.dataset.type = 'dropZone';

    // Get the canvas container position
    const canvasContainer = this.elements.canvas;
    const containerRect = canvasContainer.getBoundingClientRect();
    
    // The blockX and blockY are already relative to the canvas container
    // since they're calculated from this.imageInfo.x and this.imageInfo.y
    // which are the image position within the Konva stage
    const dropZoneX = blockX;
    const dropZoneY = blockY;
    const dropZoneWidth = blockWidth;
    const dropZoneHeight = blockHeight;

    // Set the position and size of the HTML drop zone
    dropZone.style.position = 'absolute';
    dropZone.style.left = `${dropZoneX}px`;
    dropZone.style.top = `${dropZoneY}px`;
    dropZone.style.width = `${dropZoneWidth}px`;
    dropZone.style.height = `${dropZoneHeight}px`;
    dropZone.style.pointerEvents = 'all';
    dropZone.style.zIndex = '10';

    console.log(`🎯 HTML Drop zone ${block.id} positioned at:`, {
      x: dropZoneX,
      y: dropZoneY,
      width: dropZoneWidth,
      height: dropZoneHeight,
      blockId: block.id,
      containerRect: {
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height
      }
    });

    // Add drop zone events
    this.addHtmlDropZoneEvents(dropZone, block);

    // Append to the canvas container
    this.elements.canvas.appendChild(dropZone);
    
    console.log(`✅ HTML Drop zone ${block.id} created and appended to canvas`);
    console.log(`🎯 Drop zone element:`, dropZone);
    console.log(`🎯 Drop zone computed styles:`, {
      left: dropZone.style.left,
      top: dropZone.style.top,
      width: dropZone.style.width,
      height: dropZone.style.height,
      position: dropZone.style.position,
      zIndex: dropZone.style.zIndex
    });
  }

  addHtmlDropZoneEvents(dropZone, block) {
    console.log(`🎯 Setting up HTML drop zone events for block ${block.id}`);
    
         // No hover feedback - keep blocks completely invisible
     // dropZone.addEventListener('mouseenter', () => {
     //   // No visual feedback on hover
     // });
     
     // dropZone.addEventListener('mouseleave', () => {
     //   // No visual feedback on leave
     // });
    
    // Handle word drop
    dropZone.addEventListener('drop', (e) => {
      console.log(`🎯 Drop event triggered on HTML drop zone for block ${block.id}`);
      console.log('🎯 Drop event details:', {
        event: e,
        dataTransfer: e.dataTransfer,
        blockId: block.id
      });
      
      try {
        // Access the dataTransfer from the event
        const dataTransfer = e.dataTransfer;
        if (dataTransfer) {
          const dropData = JSON.parse(dataTransfer.getData('text/plain'));
          console.log('🎯 Drop data received:', dropData);
          this.handleWordDrop(dropData, block.id);
        } else {
          console.warn('⚠️ No dataTransfer available in drop event');
        }
      } catch (error) {
        console.error('❌ Error parsing drop data:', error);
      }
    });
    
    // Allow drop
    dropZone.addEventListener('dragover', (e) => {
      console.log(`🎯 Drag over on HTML drop zone for block ${block.id}`);
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
        console.log('🎯 Set drop effect to copy');
      }
    });
    
         // No visual feedback during drag operations
     // dropZone.addEventListener('dragenter', (e) => {
     //   e.preventDefault();
     //   // No visual feedback
     // });
     
     // dropZone.addEventListener('dragleave', (e) => {
     //   // No visual feedback
     // });
    
    console.log(`✅ HTML drop zone events set up for block ${block.id}`);
  }

  createHTMLDropZones() {
    // This function is no longer used - back to Konva drop zones
    console.log(`🎯 HTML drop zones deprecated - using Konva drop zones instead`);
  }

  addHTMLDropZoneEvents(dropZone, block) {
    // This function is no longer used - back to Konva drop zones
    console.log(`🎯 HTML drop zone events deprecated - using Konva drop zones instead`);
  }

  renderWords() {
    console.log('📝 Rendering words panel...');
    
    if (!this.elements.wordsGrid) {
      console.error('❌ Words grid element not found');
      return;
    }
    
    // Clear existing words
    this.elements.wordsGrid.innerHTML = '';
    
    // Create word items
    this.words.forEach(word => {
      const wordItem = document.createElement('div');
      wordItem.className = 'matching-test__word-item';
      wordItem.id = `word_${word.id}`;
      wordItem.textContent = word.word;
      wordItem.draggable = true;
      wordItem.dataset.wordId = word.id;
      wordItem.dataset.word = word.word;
      
      // Add drag events
      this.addWordDragEvents(wordItem, word);
      
      // Add to grid
      this.elements.wordsGrid.appendChild(wordItem);
    });
    
    // Update words count
    this.updateWordsCount();
    
    console.log(`✅ Rendered ${this.words.length} words`);
  }

  addWordDragEvents(wordItem, word) {
    wordItem.addEventListener('dragstart', (e) => {
      console.log('🎯 Word drag started:', word.word);
      
      // Set drag data
      const dragData = {
        wordId: word.id,
        word: word.word
      };
      console.log('🎯 Setting drag data:', dragData);
      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      
      // Set drag effect
      e.dataTransfer.effectAllowed = 'copy';
      
      // Add dragging class
      wordItem.classList.add('matching-test__word-item--dragging');
      
      // Set drag image
      const dragImage = wordItem.cloneNode(true);
      dragImage.style.opacity = '0.5';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.left = '-1000px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Remove drag image after drag starts
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    });
    
    wordItem.addEventListener('dragend', (e) => {
      console.log('🎯 Word drag ended:', word.word);
      wordItem.classList.remove('matching-test__word-item--dragging');
      
      // Check if word was dropped successfully
      if (e.dataTransfer.dropEffect === 'none') {
        console.log('⚠️ Word was not dropped on a valid target');
      } else {
        console.log('✅ Word was dropped successfully');
      }
    });
    
    // Prevent default drag behavior
    wordItem.addEventListener('drag', (e) => {
      e.preventDefault();
    });
    
    console.log(`✅ Word drag events set up for word: ${word.word}`);
  }

  handleWordDrop(dropData, blockId) {
    const { wordId, word } = dropData;
    
    console.log('🎯 Word dropped:', { word, blockId });
    
    // Check if word is already placed
    if (this.placedWords[wordId]) {
      console.log('⚠️ Word already placed, removing previous placement');
      this.removeWordPlacement(wordId);
    }
    
    // Check if block already has a word
    const existingWordId = Object.keys(this.placedWords).find(id => 
      this.placedWords[id].blockId === blockId
    );
    
    if (existingWordId) {
      console.log('⚠️ Block already has a word, removing it');
      this.removeWordPlacement(existingWordId);
    }
    
    // Place word
    this.placeWord(wordId, blockId);
    
    // Update progress
    this.updateProgress();
    
    // Check completion
    this.checkCompletion();
  }

  placeWord(wordId, blockId) {
    const word = this.words.find(w => w.id === wordId);
    const block = this.blocks.find(b => b.id === blockId);
    
    if (!word || !block) {
      console.error('❌ Word or block not found');
      return;
    }
    
    console.log(`🔍 Placing word "${word.word}" (ID: ${wordId}) on block ${blockId}`);
    console.log(`🔍 Expected placement: word ${wordId} should go on block ${wordId}`);
    console.log(`🔍 Actual placement: word ${wordId} going on block ${blockId}`);
    
    // Update word state
    word.blockId = blockId;
    word.isPlaced = true;
    
    // Check if placement is correct (word ID matches block ID)
    // This is the traditional matching logic where word 1 should go on block 1, etc.
    word.isCorrect = (wordId === blockId);
    
    console.log(`🔍 Placement correctness: ${word.isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    
    // Store placement
    this.placedWords[wordId] = {
      blockId: blockId,
      coordinates: block.coordinates,
      isCorrect: word.isCorrect,
      wordId: wordId,
      word: word.word
    };
    
    // Update word item appearance and hide it from words section
    const wordItem = document.getElementById(`word_${wordId}`);
    if (wordItem) {
      // Always hide the word from words section when placed, regardless of correctness
      wordItem.style.display = 'none';
      wordItem.classList.add('matching-test__word-item--matched');
      wordItem.draggable = false;
      
      if (word.isCorrect) {
        this.correctMatches++;
        console.log(`✅ Word "${word.word}" correctly placed and hidden from words section`);
      } else {
        console.log(`⚠️ Word "${word.word}" incorrectly placed but hidden from words section`);
      }
    }
    
    // Visual feedback on block
    this.highlightBlock(blockId, word.isCorrect, word.word);
    
    console.log(`✅ Word "${word.word}" placed on block ${blockId}, correct: ${word.isCorrect}`);
    console.log(`📊 Current correct matches: ${this.correctMatches}/${this.words.length}`);
  }

  removeWordPlacement(wordId) {
    const word = this.words.find(w => w.id === wordId);
    if (!word) return;
    
    // Store the blockId before clearing it
    const blockId = word.blockId;
    
    // Update word state
    word.blockId = null;
    word.isPlaced = false;
    word.isCorrect = false;
    
    // Remove from placed words
    delete this.placedWords[wordId];
    
    // Update word item appearance and show it again in words section
    const wordItem = document.getElementById(`word_${wordId}`);
    if (wordItem) {
      wordItem.classList.remove('matching-test__word-item--matched');
      wordItem.draggable = true;
      // Show the word again in the words section
      wordItem.style.display = 'block';
      console.log(`🔄 Word "${word.word}" shown again in words section`);
    }
    
    // Remove block highlight using the stored blockId
    if (blockId) {
      this.removeBlockHighlight(blockId);
      // Also clear the word text from the dropzone
      this.highlightBlock(blockId, false, '');
    }
    
    // Update correct matches count - check if the removed word was correct
    if (word.isCorrect) {
      this.correctMatches--;
    }
    
    console.log(`🗑️ Removed word "${word.word}" placement from block ${blockId}`);
  }

  highlightBlock(blockId, isCorrect, wordText = '') {
    try {
      // ✅ SAFETY CHECK #1: Validate blockId
      if (!blockId || (typeof blockId !== 'string' && typeof blockId !== 'number')) {
        console.warn('⚠️ Invalid blockId:', blockId);
        return;
      }
      
      // ✅ SAFETY CHECK #2: Find dropzone with validation
      const dropZone = document.getElementById(`dropZone_${blockId}`);
      if (!dropZone) {
        console.warn('⚠️ Dropzone not found for blockId:', blockId);
        return;
      }
      
      // ✅ SAFETY CHECK #3: Validate wordText
      if (!wordText || typeof wordText !== 'string' || wordText.length === 0) {
        console.warn('⚠️ Invalid wordText:', wordText);
        return;
      }
      
      // ✅ SAFETY CHECK #4: Apply color logic
      if (isCorrect) {
        // Correct placement - green background and border
        dropZone.style.background = 'rgba(40, 167, 69, 0.4)'; // Light green background
        dropZone.style.borderColor = 'rgba(40, 167, 69, 1)'; // Solid green border
      } else {
        // Incorrect placement - blue background and border
        dropZone.style.background = 'rgba(40, 167, 69, 0.4)'; // Light green background
        dropZone.style.borderColor = 'rgba(40, 167, 69, 1)'; // Solid green border
      }
      
      // ✅ SAFETY CHECK #5: Set text content
      dropZone.textContent = wordText;
      
      // ✅ SAFETY CHECK #6: Calculate font size with validation
      let fontSize = 12; // Default fallback
      if (this.getSimpleFontSize && typeof this.getSimpleFontSize === 'function') {
        try {
          fontSize = this.getSimpleFontSize(wordText);
        } catch (fontError) {
          console.warn('⚠️ Font size calculation failed:', fontError);
        }
      }
      
      // ✅ SAFETY CHECK #7: Validate and clamp fontSize
      fontSize = this.validateFontSize(fontSize);
      
      // ✅ SAFETY CHECK #8: Create CSS properties object
      const cssProperties = {
        fontSize: `${fontSize}px`,
        fontWeight: '600',
        color: '#2c3e50',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      };
      
      // ✅ SAFETY CHECK #9: Apply CSS safely
      if (this.applySafeCSS && typeof this.applySafeCSS === 'function') {
        this.applySafeCSS(dropZone, cssProperties);
      } else {
        // Fallback: apply CSS directly
        this.applyCSSDirectly(dropZone, cssProperties);
      }
      
      console.log('✅ Word display applied successfully:', { blockId, wordText, fontSize });
      
    } catch (error) {
      console.error('❌ Error in highlightBlock:', error);
      // Emergency fallback
      this.emergencyWordDisplay(blockId, wordText);
    }
  }

  // ✅ SAFETY METHOD: Calculate simple font size based on word length
  getSimpleFontSize(word) {
    try {
      if (!word || typeof word !== 'string') return 12;
      
      const length = word.length;
      if (length <= 10) return 12;
      if (length <= 20) return 10;
      if (length <= 30) return 8;
      return 6;
    } catch (error) {
      console.warn('⚠️ Font size calculation error:', error);
      return 12; // Safe fallback
    }
  }

  // ✅ SAFETY METHOD: Validate and clamp font size
  validateFontSize(size) {
    try {
      if (typeof size === 'number' && isFinite(size) && size > 0) {
        return Math.max(6, Math.min(size, 12)); // Clamp to safe range 6-12px
      }
      return 12; // Default fallback
    } catch (error) {
      console.warn('⚠️ Font size validation error:', error);
      return 12; // Safe fallback
    }
  }

  // ✅ SAFETY METHOD: Apply CSS safely with error handling
  applySafeCSS(element, properties) {
    try {
      if (!element || !properties || typeof properties !== 'object') {
        console.warn('⚠️ Invalid parameters for applySafeCSS');
        return;
      }
      
      Object.entries(properties).forEach(([property, value]) => {
        try {
          if (value && value !== 'undefined' && value !== 'null') {
            element.style[property] = value;
          }
        } catch (cssError) {
          console.warn(`⚠️ Failed to apply CSS property ${property}:`, cssError);
        }
      });
      
      console.log('✅ CSS applied safely');
    } catch (error) {
      console.error('❌ Error in applySafeCSS:', error);
      // Fallback to direct application
      this.applyCSSDirectly(element, properties);
    }
  }

  // ✅ SAFETY METHOD: Direct CSS application fallback
  applyCSSDirectly(element, properties) {
    try {
      if (!element || !properties) return;
      
      Object.entries(properties).forEach(([property, value]) => {
        try {
          element.style[property] = value;
        } catch (cssError) {
          console.warn(`⚠️ Failed to apply CSS property ${property}:`, cssError);
        }
      });
      
      console.log('✅ CSS applied directly');
    } catch (error) {
      console.error('❌ Error in applyCSSDirectly:', error);
    }
  }

  // ✅ SAFETY METHOD: Emergency fallback display
  emergencyWordDisplay(blockId, wordText) {
    try {
      const dropZone = document.getElementById(`dropZone_${blockId}`);
      if (dropZone && wordText) {
        dropZone.textContent = wordText;
        dropZone.style.fontSize = '12px';
        dropZone.style.whiteSpace = 'nowrap';
        dropZone.style.overflow = 'hidden';
        dropZone.style.textOverflow = 'ellipsis';
        console.log('⚠️ Emergency word display applied');
      }
    } catch (emergencyError) {
      console.error('❌ Emergency display also failed:', emergencyError);
    }
  }

  removeBlockHighlight(blockId) {
    // Reset block to completely invisible
    const blockRect = this.layers.content.findOne(`#block_${blockId}`);
    if (blockRect) {
      blockRect.fill('transparent');
      blockRect.stroke('transparent');
      blockRect.strokeWidth(0);
    }
    
    // Also clear word text from dropzone
    this.highlightBlock(blockId, false, '');
    
    this.stage.batchDraw();
  }

  updateProgress() {
    // Calculate progress based on placed words (not just correct ones)
    const placedWordsCount = Object.keys(this.placedWords).length;
    const progressPercentage = (placedWordsCount / this.totalWords) * 100;
    
    // Update progress bar
    this.elements.progressFill.style.width = `${progressPercentage}%`;
    
    // Update progress text to show both placed and correct
    this.elements.progressText.textContent = `${placedWordsCount} / ${this.totalWords} words placed (${this.correctMatches} correct)`;
    
    console.log(`📊 Progress updated: ${placedWordsCount}/${this.totalWords} words placed, ${this.correctMatches} correct (${progressPercentage.toFixed(1)}%)`);
  }

  updateWordsCount() {
    if (this.elements.wordsCount) {
      const placedWordsCount = Object.keys(this.placedWords).length;
      this.elements.wordsCount.textContent = `${placedWordsCount} / ${this.totalWords} words placed`;
    }
    
    // Update words section title to show remaining words
    this.updateWordsSectionTitle();
  }

  updateWordsSectionTitle() {
    const wordsSectionTitle = document.querySelector('.matching-test__words-title');
    if (wordsSectionTitle) {
      const placedWordsCount = Object.keys(this.placedWords).length;
      const remainingWords = this.totalWords - placedWordsCount;
      
      if (remainingWords === 0) {
        if (this.correctMatches === this.totalWords) {
          wordsSectionTitle.textContent = 'All words have been placed correctly!';
          wordsSectionTitle.style.color = '#28a745';
        } else {
          wordsSectionTitle.textContent = 'All words placed! Ready to submit.';
          wordsSectionTitle.style.color = '#ffc107';
        }
      } else if (remainingWords === 1) {
        wordsSectionTitle.textContent = `1 word remaining to place:`;
        wordsSectionTitle.style.color = '#ffc107';
      } else {
        wordsSectionTitle.textContent = `${remainingWords} words remaining to place:`;
        wordsSectionTitle.style.color = 'white';
      }
    }
  }

  checkCompletion() {
    // Allow submission when all words are placed, regardless of correctness
    const placedWordsCount = Object.keys(this.placedWords).length;
    this.isComplete = placedWordsCount === this.totalWords;
    this.canSubmit = this.isComplete;
    
    // Update submit button
    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = !this.canSubmit;
    }
    
    if (this.isComplete) {
      if (this.correctMatches === this.totalWords) {
        console.log('🎉 All words matched correctly! Test can be submitted.');
      } else {
        console.log(`📝 All words placed (${placedWordsCount}/${this.totalWords}), but only ${this.correctMatches} are correct. Test can be submitted.`);
      }
    }
  }

  // Arrow legend method removed - no longer needed

  hideLoadingOverlay() {
    console.log('🔍 Attempting to hide loading overlay...');
    
    if (this.elements.canvasOverlay) {
      console.log('✅ Found canvasOverlay element, hiding it...');
      this.elements.canvasOverlay.style.display = 'none';
      console.log('✅ Loading overlay hidden successfully');
    } else {
      console.warn('⚠️ canvasOverlay element not found');
    }
    
    if (this.elements.canvasLoading) {
      console.log('✅ Found canvasLoading element, hiding it...');
      this.elements.canvasLoading.style.display = 'none';
      console.log('✅ Loading spinner hidden successfully');
    } else {
      console.warn('⚠️ canvasLoading element not found');
    }
  }

  handleResize() {
    if (this.stage) {
      const newWidth = this.elements.canvas.offsetWidth;
      const newHeight = this.elements.canvas.offsetHeight;
      
      this.stage.width(newWidth);
      this.stage.height(newHeight);
      
      // Re-center image if it exists
      if (this.imageInfo) {
        this.recenterImage();
        
        // 🆕 CRITICAL: After image moves, update ALL other elements
        this.updateAllElementPositions();
      }
      
      this.stage.batchDraw();
    }
  }

  // ✅ CORRECTED: Update all element positions after image recentering
  updateAllElementPositions() {
    try {
      // 1. Update Konva blocks to match new image position
      this.updateKonvaBlockPositions();
      
      // 2. Update Konva arrows to match new image position  
      this.updateKonvaArrowPositions();
      
      // 3. Update HTML dropzones to match new Konva positions
      this.updateHtmlDropzonePositions();
      
      console.log('✅ All element positions updated successfully');
    } catch (error) {
      console.error('❌ Error updating element positions:', error);
      // Fallback: re-render everything if update fails
      this.fallbackRerenderElements();
    }
  }

  // ✅ CORRECTED: Update Konva block positions with proper error handling
  updateKonvaBlockPositions() {
    if (!this.blocks || !Array.isArray(this.blocks)) {
      console.warn('⚠️ No blocks to update');
      return;
    }

    this.blocks.forEach(block => {
      try {
        const konvaBlock = this.layers.content.findOne(`#block_${block.id}`);
        if (konvaBlock && block.coordinates) {
          // Recalculate block position using same logic as renderBlocks()
          let blockX, blockY, blockWidth, blockHeight;
          
          // Parse coordinates if needed (same as renderBlocks)
          let coordinates = block.coordinates;
          if (typeof coordinates === 'string') {
            try {
              coordinates = JSON.parse(coordinates);
            } catch (e) {
              console.error(`❌ Failed to parse coordinates for block ${block.id}:`, e);
              return; // Skip this block
            }
          }
          
          // Validate coordinates (same as renderBlocks)
          if (!coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number' || 
              typeof coordinates.width !== 'number' || typeof coordinates.height !== 'number') {
            console.error(`❌ Invalid coordinates structure for block ${block.id}:`, coordinates);
            return; // Skip this block
          }
          
          if (coordinates.rel_x !== null && coordinates.rel_y !== null && 
              coordinates.rel_width !== null && coordinates.rel_height !== null &&
              coordinates.image_width && coordinates.image_height) {
            // Use relative coordinates
            const originalWidth = coordinates.image_width;
            const originalHeight = coordinates.image_height;
            const scaleX = this.imageInfo.width / originalWidth;
            const scaleY = this.imageInfo.height / originalHeight;
            
            blockX = this.imageInfo.x + (coordinates.rel_x / 100) * originalWidth * scaleX;
            blockY = this.imageInfo.y + (coordinates.rel_y / 100) * originalHeight * scaleY;
            blockWidth = (coordinates.rel_width / 100) * originalWidth * scaleX;
            blockHeight = (coordinates.rel_height / 100) * originalHeight * scaleY;
          } else {
            // Use absolute coordinates
            blockX = this.imageInfo.x + (coordinates.x * this.imageInfo.scaleX);
            blockY = this.imageInfo.y + (coordinates.y * this.imageInfo.scaleY);
            blockWidth = coordinates.width * this.imageInfo.scaleX;
            blockHeight = coordinates.height * this.imageInfo.scaleX;
          }
          
          // Update Konva block position AND size
          konvaBlock.x(blockX);
          konvaBlock.y(blockY);
          konvaBlock.width(blockWidth);
          konvaBlock.height(blockHeight);
          
          console.log(`✅ Block ${block.id} updated:`, { x: blockX, y: blockY, width: blockWidth, height: blockHeight });
        }
      } catch (error) {
        console.error(`❌ Error updating block ${block.id}:`, error);
      }
    });
  }

  // ✅ ENHANCED: Update Konva arrow positions with unified scaling logic
  updateKonvaArrowPositions() {
    if (!this.arrows || !Array.isArray(this.arrows)) {
      console.warn('⚠️ No arrows to update');
      return;
    }

    this.arrows.forEach(arrow => {
      try {
        // Find arrow in the content layer by ID
        const arrowLine = this.layers.content.findOne(`#arrow_${arrow.id}`);
        if (arrowLine && this.imageInfo && 
            typeof this.imageInfo.scaleX === 'number' && 
            typeof this.imageInfo.scaleY === 'number' &&
            this.imageInfo.scaleX > 0 && 
            this.imageInfo.scaleY > 0) {
          
          let startX, startY, endX, endY;
          
          // ✅ UNIFIED: Same scaling logic as blocks for perfect alignment
          if (arrow.rel_start_x !== null && arrow.rel_start_y !== null && 
              arrow.rel_end_x !== null && arrow.rel_end_y !== null &&
              arrow.image_width && arrow.image_height &&
              arrow.image_width > 0 && arrow.image_height > 0) {
            
            // ✅ UNIFIED: Same calculation as blocks
            const originalWidth = arrow.image_width;
            const originalHeight = arrow.image_height;
            const scaleX = this.imageInfo.width / originalWidth;
            const scaleY = this.imageInfo.height / originalHeight;
            
            startX = this.imageInfo.x + (arrow.rel_start_x / 100) * originalWidth * scaleX;
            startY = this.imageInfo.y + (arrow.rel_start_y / 100) * originalHeight * scaleY;
            endX = this.imageInfo.x + (arrow.rel_end_x / 100) * originalWidth * scaleX;
            endY = this.imageInfo.y + (arrow.rel_end_y / 100) * originalHeight * scaleY;
            
          } else if (arrow.start && arrow.end) {
            // ✅ UNIFIED: Same fallback logic as blocks
            startX = this.imageInfo.x + (arrow.start.x * this.imageInfo.scaleX);
            startY = this.imageInfo.y + (arrow.start.y * this.imageInfo.scaleY);
            endX = this.imageInfo.x + (arrow.end.x * this.imageInfo.scaleX);
            endY = this.imageInfo.y + (arrow.end.y * this.imageInfo.scaleY);
            
          } else {
            console.warn(`⚠️ Arrow ${arrow.id} has no valid coordinates, skipping`);
            return;
          }
          
          // Update arrow position
          arrowLine.points([startX, startY, endX, endY]);
          
          // Scale arrow visual properties safely
          const scaleFactor = Math.min(this.imageInfo.scaleX, this.imageInfo.scaleY);
          if (arrow.style && typeof arrow.style.thickness === 'number') {
            arrowLine.strokeWidth(arrow.style.thickness * scaleFactor);
          }
          if (arrow.style && typeof arrow.style.pointerLength === 'number') {
            arrowLine.pointerLength(arrow.style.pointerLength * scaleFactor);
          }
          if (arrow.style && typeof arrow.style.pointerWidth === 'number') {
            arrowLine.pointerWidth(arrow.style.pointerWidth * scaleFactor);
          }
          
          console.log(`✅ Arrow ${arrow.id} updated with unified scaling:`, { 
            start: { x: startX, y: startY }, 
            end: { x: endX, y: endY } 
          });
        }
      } catch (error) {
        console.error(`❌ Error updating arrow ${arrow.id}:`, error);
      }
    });
  }

  // ✅ CORRECTED: Update HTML dropzone positions
  updateHtmlDropzonePositions() {
    if (!this.blocks || !Array.isArray(this.blocks)) {
      console.warn('⚠️ No blocks to update dropzones for');
      return;
    }

    this.blocks.forEach(block => {
      try {
        const konvaBlock = this.layers.content.findOne(`#block_${block.id}`);
        const dropZone = document.getElementById(`dropZone_${block.id}`);
        
        if (konvaBlock && dropZone) {
          // Update dropzone to match Konva block position and size
          dropZone.style.left = `${konvaBlock.x()}px`;
          dropZone.style.top = `${konvaBlock.y()}px`;
          dropZone.style.width = `${konvaBlock.width()}px`;
          dropZone.style.height = `${konvaBlock.height()}px`;
          
          console.log(`✅ Dropzone ${block.id} updated:`, {
            x: konvaBlock.x(), y: konvaBlock.y(),
            width: konvaBlock.width(), height: konvaBlock.height()
          });
        }
      } catch (error) {
        console.error(`❌ Error updating dropzone ${block.id}:`, error);
      }
    });
  }

  // ✅ CORRECTED: Safety net with unique method name
  fallbackRerenderElements() {
    console.warn('⚠️ Falling back to full re-render due to update error');
    try {
      // Clear and re-render everything
      this.layers.content.destroyChildren();
      this.renderBlocks();
      this.renderArrows();
      console.log('✅ Fallback re-render completed');
    } catch (error) {
      console.error('❌ Fallback re-render also failed:', error);
    }
  }

  recenterImage() {
    try {
      // ✅ SAFETY CHECK #1: Validate required properties exist
      if (!this.imageInfo || !this.layers.background) {
        console.warn('⚠️ Image info or background layer not available');
        return;
      }
      
      // ✅ SAFETY CHECK #2: Validate stage exists
      if (!this.stage) {
        console.warn('⚠️ Konva stage not available');
        return;
      }
      
      // ✅ SAFETY CHECK #3: Validate original dimensions exist
      if (!this.originalImageWidth || !this.originalImageHeight) {
        console.warn('⚠️ Original image dimensions not available');
        return;
      }
      
      // ✅ SAFETY CHECK #4: Validate original dimensions are valid numbers
      if (this.originalImageWidth <= 0 || this.originalImageHeight <= 0) {
        console.error('❌ Invalid original image dimensions:', {
          width: this.originalImageWidth,
          height: this.originalImageHeight
        });
        return;
      }
      
      // ✅ SAFETY CHECK #5: Validate original dimensions are numbers
      if (typeof this.originalImageWidth !== 'number' || typeof this.originalImageHeight !== 'number') {
        console.error('❌ Original image dimensions are not numbers:', {
          width: this.originalImageWidth,
          height: this.originalImageHeight
        });
        return;
      }
      
      const canvasWidth = this.stage.width();
      const canvasHeight = this.stage.height();
      
      // ✅ SAFETY CHECK #6: Validate canvas dimensions are numbers
      if (typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number') {
        console.error('❌ Canvas dimensions are not numbers:', {
          width: canvasWidth,
          height: canvasHeight
        });
        return;
      }
      
      // ✅ SAFETY CHECK #7: Validate canvas dimensions
      if (canvasWidth <= 0 || canvasHeight <= 0) {
        console.error('❌ Invalid canvas dimensions:', {
          width: canvasWidth,
          height: canvasHeight
        });
        return;
      }
      
      let newWidth, newHeight, newX, newY;
      
      // ✅ SAFETY CHECK #8: Validate before division
      if (this.originalImageHeight === 0) {
        console.error('❌ Original image height is 0');
        return;
      }
      
      // ✅ SAFETY CHECK #9: Calculate aspect ratios safely
      const imgAspectRatio = this.originalImageWidth / this.originalImageHeight;
      const canvasAspectRatio = canvasWidth / canvasHeight;
      
      // ✅ LOGIC: Only scale down if image is larger than canvas
      if (this.originalImageWidth <= canvasWidth && this.originalImageHeight <= canvasHeight) {
        // Image fits in canvas - keep original size
        newWidth = this.originalImageWidth;
        newHeight = this.originalImageHeight;
        console.log('📱 Image fits in canvas - keeping original size:', { width: newWidth, height: newHeight });
      } else {
        // Image is larger than canvas - scale down to fit
        if (imgAspectRatio > canvasAspectRatio) {
          // Image is wider than canvas - fit to width
          newWidth = canvasWidth * 0.95;
          newHeight = newWidth / imgAspectRatio;
        } else {
          // Image is taller than canvas - fit to height
          newHeight = canvasHeight * 0.95;
          newWidth = newHeight * imgAspectRatio;
        }
        console.log('📱 Image scaled down to fit canvas:', { width: newWidth, height: newHeight });
      }
      
      // ✅ SAFETY CHECK #10: Validate calculated dimensions using compatible methods
      if (newWidth <= 0 || newHeight <= 0 || isNaN(newWidth) || isNaN(newHeight) || !isFinite(newWidth) || !isFinite(newHeight)) {
        console.error('❌ Invalid calculated dimensions:', { width: newWidth, height: newHeight });
        return;
      }
      
      // Center the image
      newX = (canvasWidth - newWidth) / 2;
      newY = (canvasHeight - newHeight) / 2;
      
      // ✅ SAFETY CHECK #11: Validate image layer has children
      const imageLayer = this.layers.background;
      if (!imageLayer || imageLayer.getChildren().length === 0) {
        console.warn('⚠️ Background layer has no children');
        return;
      }
      
      // Update Konva image with new position AND size
      const konvaImage = imageLayer.getChildren()[0];
      
      // ✅ SAFETY CHECK #12: Use multiple validation methods for Konva Image
      if (konvaImage && (konvaImage.image || (konvaImage.getClassName && konvaImage.getClassName() === 'Image') || konvaImage.constructor.name === 'Image')) {
        konvaImage.x(newX);
        konvaImage.y(newY);
        konvaImage.width(newWidth);
        konvaImage.height(newHeight);
        
        // Update stored image info
        this.imageInfo.x = newX;
        this.imageInfo.y = newY;
        this.imageInfo.width = newWidth;
        this.imageInfo.height = newHeight;
        this.imageInfo.scaleX = newWidth / this.originalImageWidth;
        this.imageInfo.scaleY = newHeight / this.originalImageHeight;
        
        console.log('✅ Image updated successfully:', {
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
          scale: { scaleX: this.imageInfo.scaleX, scaleY: this.imageInfo.scaleY }
        });
        
        // ✅ SAFETY CHECK #13: Validate method exists before calling (multiple checks)
        if (this.blocks && this.blocks.length > 0 && this.updateAllElementPositions && typeof this.updateAllElementPositions === 'function') {
          // 🆕 CRITICAL: After image rescaling, update ALL element positions
          this.updateAllElementPositions();
        } else {
          console.log('ℹ️ No blocks to update or update method not available - skipping element position updates');
        }
      } else {
        console.error('❌ Invalid image element in background layer');
      }
      
    } catch (error) {
      console.error('❌ Error in recenterImage:', error);
      // Fallback: try to at least center the existing image
      this.fallbackCenterImage();
    }
  }

  // ✅ SAFETY NET: Fallback method if main logic fails
  fallbackCenterImage() {
    try {
      if (this.imageInfo && this.layers.background && this.stage) {
        const konvaImage = this.layers.background.getChildren()[0];
        if (konvaImage && (konvaImage.image || (konvaImage.getClassName && konvaImage.getClassName() === 'Image'))) {
          const canvasWidth = this.stage.width();
          const canvasHeight = this.stage.height();
          
          // Validate canvas dimensions
          if (typeof canvasWidth === 'number' && typeof canvasHeight === 'number' && canvasWidth > 0 && canvasHeight > 0) {
            // Just center without rescaling
            const imgX = (canvasWidth - this.imageInfo.width) / 2;
            const imgY = (canvasHeight - this.imageInfo.height) / 2;
            
            konvaImage.x(imgX);
            konvaImage.y(imgY);
            
            this.imageInfo.x = imgX;
            this.imageInfo.y = imgY;
            
            console.log('⚠️ Fallback image centering applied');
          }
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback centering also failed:', fallbackError);
    }
  }

  bindEvents() {
    // Back button
    if (this.elements.backBtn) {
      this.elements.backBtn.addEventListener('click', () => {
        this.showBackToCabinetModal();
      });
    }
    
    // Reset button
    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => {
        this.showResetModal();
      });
    }
    
    // Submit button
    if (this.elements.submitBtn) {
      this.elements.submitBtn.addEventListener('click', () => {
        this.submitTest();
      });
    }
    
    // Modal event handlers
    this.bindModalEvents();
    
    console.log('🔗 Events bound successfully');
  }

  bindModalEvents() {
    // Back to Cabinet modal events
    if (this.elements.backToCabinetCancel) {
      this.elements.backToCabinetCancel.addEventListener('click', () => {
        this.hideModal();
      });
    }
    
    if (this.elements.backToCabinetConfirm) {
      this.elements.backToCabinetConfirm.addEventListener('click', () => {
        this.hideModal();
        this.goBackToCabinet();
      });
    }
    
    // Reset modal events
    if (this.elements.resetCancel) {
      this.elements.resetCancel.addEventListener('click', () => {
        this.hideModal();
      });
    }
    
    if (this.elements.resetConfirm) {
      this.elements.resetConfirm.addEventListener('click', () => {
        this.hideModal();
        this.resetTest();
      });
    }
    
    // Close modal when clicking overlay
    if (this.elements.modalOverlay) {
      this.elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.modalOverlay) {
          this.hideModal();
        }
      });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.modalOverlay.classList.contains('show')) {
        this.hideModal();
      }
    });
  }

  showBackToCabinetModal() {
    if (this.elements.modalOverlay && this.elements.backToCabinetModal) {
      this.elements.backToCabinetModal.style.display = 'block';
      this.elements.resetModal.style.display = 'none';
      this.elements.modalOverlay.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Focus the first button for accessibility
      setTimeout(() => {
        if (this.elements.backToCabinetCancel) {
          this.elements.backToCabinetCancel.focus();
        }
      }, 100);
    }
  }

  showResetModal() {
    if (this.elements.modalOverlay && this.elements.resetModal) {
      this.elements.resetModal.style.display = 'block';
      this.elements.backToCabinetModal.style.display = 'none';
      this.elements.modalOverlay.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Focus the first button for accessibility
      setTimeout(() => {
        if (this.elements.resetCancel) {
          this.elements.resetCancel.focus();
        }
      }, 100);
    }
  }

  hideModal() {
    if (this.elements.modalOverlay) {
      this.elements.modalOverlay.classList.remove('show');
      document.body.style.overflow = ''; // Restore background scrolling
      
      // Hide both modals
      if (this.elements.backToCabinetModal) {
        this.elements.backToCabinetModal.style.display = 'none';
      }
      if (this.elements.resetModal) {
        this.elements.resetModal.style.display = 'none';
      }
    }
  }

  resetTest() {
    console.log('🔄 Resetting test...');
    console.log('🔄 Before reset - placedWords:', this.placedWords);
    console.log('🔄 Before reset - correctMatches:', this.correctMatches);
    
    // Clear all placements
    Object.keys(this.placedWords).forEach(wordId => {
      console.log(`🔄 Removing placement for word ${wordId}`);
      this.removeWordPlacement(wordId);
    });
    
    // Reset state
    this.correctMatches = 0;
    this.isComplete = false;
    this.canSubmit = false;
    
    // Reset all word elements to original state
    this.resetAllWordElements();
    
    console.log('🔄 After reset - correctMatches:', this.correctMatches);
    console.log('🔄 After reset - placedWords:', this.placedWords);
    
    // Update UI
    this.updateProgress();
    this.updateWordsCount();
    
    // Reset submit button
    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = true;
    }
    
    console.log('✅ Test reset successfully');
  }

  resetAllWordElements() {
    console.log('🔄 Resetting all word elements to original state...');
    
    this.words.forEach(word => {
      // Reset word state
      word.blockId = null;
      word.isPlaced = false;
      word.isCorrect = false;
      
      // Reset word element appearance
      const wordItem = document.getElementById(`word_${word.id}`);
      if (wordItem) {
        wordItem.classList.remove('matching-test__word-item--matched');
        wordItem.classList.remove('matching-test__word-item--dragging');
        wordItem.draggable = true;
        wordItem.style.opacity = '1';
        wordItem.style.transform = 'none';
        // Ensure word is visible in words section
        wordItem.style.display = 'block';
        console.log(`🔄 Word "${word.word}" reset and made visible`);
      }
    });
    
    // Clear placedWords object
    this.placedWords = {};
    
    // Reset all block highlights
    this.resetAllBlockHighlights();
    
    console.log('✅ All word elements reset to original state');
  }

  resetDropzone(blockId) {
    const dropzone = document.getElementById(`dropZone_${blockId}`);
    if (dropzone) {
      dropzone.textContent = '';
      dropzone.style.background = 'rgb(255, 255, 255)';
      dropzone.style.borderColor = 'rgba(53, 21, 236, 0.8)';
    }
  }

  resetAllBlockHighlights() {
    console.log('🔄 Resetting all block highlights...');
    
    this.blocks.forEach(block => {
      const blockRect = this.layers.content.findOne(`#block_${block.id}`);
      if (blockRect) {
        blockRect.fill('transparent');
        blockRect.stroke('transparent');
        blockRect.strokeWidth(0);
      }
      
      // Reset dropzone to original state
      this.resetDropzone(block.id);
    });
    
    this.stage.batchDraw();
    console.log('✅ All block highlights reset');
  }

  async submitTest() {
    if (!this.canSubmit) {
      console.warn('⚠️ Cannot submit test - not all words are placed');
      return;
    }
    
    console.log('📤 Submitting test...');
    
    try {
      // Prepare submission data
      const submissionData = {
        test_id: this.testData.test_id,
        student_data: this.getStudentData(),
        answers: this.prepareAnswers(),
        academic_period_id: null // Will be determined by backend
      };
      
      console.log('📦 Submission data prepared:', submissionData);
      
      // Check authentication before submitting
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Submit to backend
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/submit-matching-type-test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit test');
      }
      
      console.log('✅ Test submitted successfully:', result);
      
      // Show results
      this.showResults(result);
      
    } catch (error) {
      console.error('❌ Error submitting test:', error);
      this.showError(`Failed to submit test: ${error.message}`);
    }
  }

    getStudentData() {
    // Check authentication first
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    try {
      // Extract student data from JWT token
      const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
      
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token: No student ID found');
      }
      
      // Return real student data from JWT token
      return {
        student_id: decoded.sub,
        name: decoded.name || 'Student',
        surname: decoded.surname || 'Name',
        nickname: decoded.nickname || decoded.name || 'Student',
        grade: decoded.grade || 'Unknown',
        class: decoded.class || 'Unknown',
        number: decoded.number || 1
      };
    } catch (error) {
      console.error('Error extracting student data from JWT:', error);
      throw new Error('Failed to get student information. Please log in again.');
    }
  }

  prepareAnswers() {
    console.log('🔍 Preparing answers for submission...');
    console.log('🔍 Current placedWords:', this.placedWords);
    console.log('🔍 Current words array:', this.words);
    console.log('🔍 Current blocks array:', this.blocks);
    
    const answers = Object.entries(this.placedWords).map(([wordId, placement]) => {
      const word = this.words.find(w => w.id === parseInt(wordId));
      const block = this.blocks.find(b => b.id === placement.blockId);
      
      if (!word || !block) {
        console.error(`❌ Missing word or block data for wordId ${wordId}`);
        return null;
      }
      
      // Use the original coordinates from the database, not the scaled ones
      const originalCoordinates = block.coordinates;
      
      const answer = {
        question_id: parseInt(wordId),
        word: word.word,
        block_id: placement.blockId,
        // Send the original coordinates that the backend expects
        block_x: originalCoordinates.x + (originalCoordinates.width / 2),
        block_y: originalCoordinates.y + (originalCoordinates.height / 2),
        is_correct: placement.isCorrect,
        expected_block_id: wordId, // The block this word should be on
        actual_block_id: placement.blockId, // The block this word is actually on
        // Add original coordinates for debugging
        original_coordinates: originalCoordinates,
        scaled_coordinates: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height
        }
      };
      
      console.log(`🔍 Answer for word ${wordId}:`, answer);
      return answer;
    }).filter(answer => answer !== null);
    
    console.log('🔍 Final answers array:', answers);
    return answers;
  }

  showResults(results) {
    console.log('📊 Showing test results...');
    console.log('🔍 Results data:', results);
    
    // Hide all test elements
    this.hideAllTestElements();
    
    // Show results section
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = 'flex';
    }
    
    // Update score display - use percentage_score for display
    if (this.elements.finalScore) {
      const displayScore = results.percentage_score || results.score;
      this.elements.finalScore.textContent = `${displayScore}%`;
      console.log('🔍 Final score element updated:', `${displayScore}%`);
      
      // Make sure the element is visible
      this.elements.finalScore.style.display = 'block';
      this.elements.finalScore.style.visibility = 'visible';
    }
    
    if (this.elements.correctMatches) {
      // Display the raw score numbers (e.g., "2/2" for 2 correct out of 2 total)
      this.elements.correctMatches.textContent = `${results.correct_matches} / ${results.total_questions}`;
      console.log('🔍 Correct matches element updated:', `${results.correct_matches} / ${results.total_questions}`);
      
      // Make sure the element is visible
      this.elements.correctMatches.style.display = 'block';
      this.elements.correctMatches.style.visibility = 'visible';
    }
    
    // Add additional score information to make numbers more prominent
    console.log('🔍 Score Summary:');
    console.log('  - Raw Score:', results.score);
    console.log('  - Max Score:', results.max_score);
    console.log('  - Correct Matches:', results.correct_matches);
    console.log('  - Total Questions:', results.total_questions);
    console.log('  - Percentage Score:', results.percentage_score);
    
    // Also log the HTML elements to make sure they exist
    console.log('🔍 HTML Elements check:');
    console.log('  - finalScore element:', this.elements.finalScore);
    console.log('  - correctMatches element:', this.elements.correctMatches);
    console.log('  - scoreFeedback element:', this.elements.scoreFeedback);
    
    // Arrow compliance display removed
    
    // Generate and display feedback
    if (this.elements.scoreFeedback) {
      const feedback = this.generateScoreFeedback(results);
      this.elements.scoreFeedback.innerHTML = feedback;
      console.log('🔍 Score feedback generated:', feedback);
    }
    
    // Bind the back to cabinet button
    this.bindResultsBackButton();
    
    console.log('✅ Results displayed successfully');
  }
  
  hideAllTestElements() {
    // Hide all test-related elements
    const elementsToHide = [
      'header',
      'topControls',
      'progressSection',
      'canvasSection',
      'wordsSection',
      'controls'
    ];
    
    elementsToHide.forEach(elementKey => {
      if (this.elements[elementKey]) {
        this.elements[elementKey].style.display = 'none';
      }
    });
    
    // Also hide the canvas overlay
    if (this.elements.canvasOverlay) {
      this.elements.canvasOverlay.style.display = 'none';
    }
    
    console.log('🔍 All test elements hidden');
  }
  
  generateScoreFeedback(results) {
    let feedback = '';
    
    // Use percentage_score if available, otherwise fall back to calculated percentage
    const scorePercentage = results.percentage_score || Math.round((results.score / results.max_score) * 100);
    
    console.log('🔍 Score calculation for feedback:');
    console.log('  - results.percentage_score:', results.percentage_score);
    console.log('  - results.score:', results.score);
    console.log('  - results.max_score:', results.max_score);
    console.log('  - Calculated percentage:', Math.round((results.score / results.max_score) * 100));
    console.log('  - Final scorePercentage:', scorePercentage);
    
    // Always show the numerical score prominently at the top
    feedback = `<div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 2.5em; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">
        ${scorePercentage}%
      </div>
      <div style="font-size: 1.2em; color: #7f8c8d; margin-bottom: 15px;">
        Score: ${results.score} out of ${results.max_score}
      </div>
    </div>`;
    
    // Motivational messages removed - keep feedback simple
    
    // Arrow compliance feedback removed
    
    console.log('🔍 Generated feedback:', feedback);
    return feedback;
  }
  
  bindResultsBackButton() {
    const backButton = document.getElementById('backToCabinetFromResults');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.goBackToCabinet();
      });
    }
  }

  showError(message) {
    console.error('❌ Error:', message);
    
    // Create error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      max-width: 400px;
      font-weight: 500;
    `;
    
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">⚠️</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  renderTest() {
    // Render words panel
    this.renderWords();
    
    // Update progress
    this.updateProgress();
    
    // Hide loading overlay after everything is rendered
    this.hideLoadingOverlay();
    
    console.log('✅ Test rendered successfully');
  }

  goBackToCabinet() {
    console.log('🔙 Going back to cabinet...');
    
    try {
      // Always navigate directly to the main application
      // This is more reliable than trying to use browser history
      console.log('🔙 Navigating to main application');
      window.location.href = 'index.html';
      
    } catch (error) {
      console.error('❌ Error navigating back:', error);
      // Fallback: force navigation to main application
      console.log('🔙 Fallback: forcing navigation to main application');
      window.location.href = 'index.html';
    }
  }


}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 DOM loaded, initializing Matching Test Student Interface...');
  
  try {
    new MatchingTestStudent();
  } catch (error) {
    console.error('❌ Failed to initialize Matching Test Student Interface:', error);
    
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f8d7da;
      border: 2px solid #f5c6cb;
      color: #721c24;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      max-width: 500px;
      z-index: 10000;
    `;
    
    errorDiv.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #721c24;">Initialization Error</h3>
      <p style="margin: 0 0 20px 0; line-height: 1.5;">
        Failed to initialize the matching test interface. Please refresh the page and try again.
      </p>
      <button onclick="location.reload()" style="
        background: #dc3545;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
      ">🔄 Refresh Page</button>
    `;
    
    document.body.appendChild(errorDiv);
  }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatchingTestStudent;
}
