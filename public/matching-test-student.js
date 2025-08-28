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
      arrowLegend: document.getElementById('arrowLegend'),
      arrowTypes: document.getElementById('arrowTypes'),
      progressFill: document.getElementById('progressFill'),
      progressText: document.getElementById('progressText'),
      resetBtn: document.getElementById('resetBtn'),
      submitBtn: document.getElementById('submitBtn'),
      finalScore: document.getElementById('finalScore'),
      correctMatches: document.getElementById('correctMatches'),
      arrowScoreItem: document.getElementById('arrowScoreItem'),
      arrowCompliance: document.getElementById('arrowCompliance'),
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
  }

  async loadTestData(testId) {
    try {
      console.log('📡 Loading test data for ID:', testId);
      
      const response = await fetch(`/.netlify/functions/get-matching-type-test?test_id=${testId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load test data');
      }
      
      this.testData = result.data;
      console.log('✅ Test data loaded successfully:', this.testData);
      
      // Update UI with test information
      this.elements.testTitle.textContent = this.testData.test_name;
      this.elements.testId.textContent = `Test ID: ${this.testData.test_id}`;
      
      // Process questions and arrows
      this.processTestData();
      
    } catch (error) {
      console.error('❌ Error loading test data:', error);
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
    
    // Process arrows
    this.arrows = this.testData.arrows.map(a => ({
      id: a.id,
      questionId: a.question_id,
      blockId: a.block_id,
      start: { x: a.start_x, y: a.start_y },
      end: { x: a.end_x, y: a.end_y },
      style: a.style || {}
    }));
    
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
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
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
        
        // Add debug border around image to visualize bounds
        const imageBorder = new Konva.Rect({
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
          stroke: '#ff0000',
          strokeWidth: 2,
          fill: 'transparent',
          dash: [5, 5]
        });
        this.layers.background.add(imageBorder);
        
        // Add debug grid lines every 50 pixels to visualize coordinate system
        for (let x = 0; x <= imgWidth; x += 50) {
          const gridLineX = new Konva.Line({
            points: [imgX + x, imgY, imgX + x, imgY + imgHeight],
            stroke: 'rgba(255, 0, 0, 0.3)',
            strokeWidth: 1,
            dash: [2, 2]
          });
          this.layers.background.add(gridLineX);
        }
        
        for (let y = 0; y <= imgHeight; y += 50) {
          const gridLineY = new Konva.Line({
            points: [imgX, imgY + y, imgX + imgWidth, imgY + y],
            stroke: 'rgba(255, 0, 0, 0.3)',
            strokeWidth: 1,
            dash: [2, 2]
          });
          this.layers.background.add(gridLineY);
        }
        
        // Store image info for coordinate calculations
        this.imageInfo = {
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
          scaleX: imgWidth / img.width,
          scaleY: imgHeight / img.height
        };
        
        console.log('🖼️ Image rendered on canvas');
        console.log('🔍 Final image info:', this.imageInfo);
        console.log('🔍 Scale factors:', {
          scaleX: this.imageInfo.scaleX,
          scaleY: this.imageInfo.scaleY
        });
        
        // Now render blocks and arrows with correct coordinates
        this.renderBlocks();
        this.renderArrows();
      };
      
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
      
      // Calculate block position relative to the displayed image
      // The coordinates from the database are relative to the original image dimensions
      // We need to scale them proportionally to the displayed image size
      const blockX = this.imageInfo.x + (coordinates.x * this.imageInfo.scaleX);
      const blockY = this.imageInfo.y + (coordinates.y * this.imageInfo.scaleY);
      const blockWidth = coordinates.width * this.imageInfo.scaleX;
      const blockHeight = coordinates.height * this.imageInfo.scaleY;
      
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
      
      // Verify block fits within image bounds
      if (blockX < this.imageInfo.x || 
          blockY < this.imageInfo.y || 
          blockX + blockWidth > this.imageInfo.x + this.imageInfo.width ||
          blockY + blockHeight > this.imageInfo.y + this.imageInfo.height) {
        console.warn(`⚠️ Block ${block.id} extends beyond image bounds!`);
        console.warn(`⚠️ Block bounds:`, {
          left: blockX,
          top: blockY,
          right: blockX + blockWidth,
          bottom: blockY + blockHeight
        });
        console.warn(`⚠️ Image bounds:`, {
          left: this.imageInfo.x,
          top: this.imageInfo.y,
          right: this.imageInfo.x + this.imageInfo.width,
          bottom: this.imageInfo.y + this.imageInfo.height
        });
        
        // Adjust block position to fit within image bounds
        let adjustedX = blockX;
        let adjustedY = blockY;
        let adjustedWidth = blockWidth;
        let adjustedHeight = blockHeight;
        
        // Ensure block doesn't extend beyond right edge
        if (blockX + blockWidth > this.imageInfo.x + this.imageInfo.width) {
          adjustedX = this.imageInfo.x + this.imageInfo.width - blockWidth;
          if (adjustedX < this.imageInfo.x) {
            adjustedX = this.imageInfo.x;
            adjustedWidth = this.imageInfo.width;
          }
        }
        
        // Ensure block doesn't extend beyond bottom edge
        if (blockY + blockHeight > this.imageInfo.y + this.imageInfo.height) {
          adjustedY = this.imageInfo.y + this.imageInfo.height - blockHeight;
          if (adjustedY < this.imageInfo.y) {
            adjustedY = this.imageInfo.y;
            adjustedHeight = this.imageInfo.height;
          }
        }
        
        // Ensure block doesn't extend beyond left edge
        if (blockX < this.imageInfo.x) {
          adjustedX = this.imageInfo.x;
        }
        
        // Ensure block doesn't extend beyond top edge
        if (blockY < this.imageInfo.y) {
          adjustedY = this.imageInfo.y;
        }
        
        console.log(`🔧 Block ${block.id} adjusted position:`, {
          x: adjustedX,
          y: adjustedY,
          width: adjustedWidth,
          height: adjustedHeight
        });
        
        // Use adjusted coordinates
        const finalBlockX = adjustedX;
        const finalBlockY = adjustedY;
        const finalBlockWidth = adjustedWidth;
        const finalBlockHeight = adjustedHeight;
        
        // Create block rectangle with adjusted coordinates
        const blockRect = new Konva.Rect({
          x: finalBlockX,
          y: finalBlockY,
          width: finalBlockWidth,
          height: finalBlockHeight,
          fill: 'rgba(0, 123, 255, 0.1)',
          stroke: '#007bff',
          strokeWidth: 2,
          cornerRadius: 6,
          id: `block_${block.id}`,
          data: { blockId: block.id, type: 'block' }
        });
        
        // Create block number with adjusted coordinates
        const blockNumber = new Konva.Text({
          x: finalBlockX + 5,
          y: finalBlockY + 5,
          text: block.id.toString(),
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fill: '#007bff',
          fontWeight: 'bold'
        });
        
        // Add expected word label below the block number
        const expectedWord = this.words.find(w => w.id === block.id);
        if (expectedWord) {
          const expectedWordLabel = new Konva.Text({
            x: finalBlockX + 5,
            y: finalBlockY + 25,
            text: `(${expectedWord.word})`,
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            fill: '#6c757d',
            fontStyle: 'italic'
          });
          this.layers.content.add(expectedWordLabel);
        }
        
        // Add to layers
        this.layers.content.add(blockRect);
        this.layers.content.add(blockNumber);
        
        // Create HTML drop zone with adjusted coordinates
        this.createHtmlDropZone(block, finalBlockX, finalBlockY, finalBlockWidth, finalBlockHeight);
        
      } else {
        // Block fits within bounds, use original calculated coordinates
        // Create block rectangle
        const blockRect = new Konva.Rect({
          x: blockX,
          y: blockY,
          width: blockWidth,
          height: blockHeight,
          fill: 'rgba(0, 123, 255, 0.1)',
          stroke: '#007bff',
          strokeWidth: 2,
          cornerRadius: 6,
          id: `block_${block.id}`,
          data: { blockId: block.id, type: 'block' }
        });
        
        // Create block number
        const blockNumber = new Konva.Text({
          x: blockX + 5,
          y: blockY + 5,
          text: block.id.toString(),
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fill: '#007bff',
          fontWeight: 'bold'
        });
        
        // Add expected word label below the block number
        const expectedWord = this.words.find(w => w.id === block.id);
        if (expectedWord) {
          const expectedWordLabel = new Konva.Text({
            x: blockX + 5,
            y: blockY + 25,
            text: `(${expectedWord.word})`,
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            fill: '#6c757d',
            fontStyle: 'italic'
          });
          this.layers.content.add(expectedWordLabel);
        }
        
        // Add to layers
        this.layers.content.add(blockRect);
        this.layers.content.add(blockNumber);
        
        // Create HTML drop zone positioned over the Konva block
        this.createHtmlDropZone(block, blockX, blockY, blockWidth, blockHeight);
      }
    });
    
    console.log(`✅ Rendered ${this.blocks.length} blocks`);
  }

  renderArrows() {
    if (this.arrows.length === 0) {
      console.log('ℹ️ No arrows to render');
      return;
    }
    
    console.log('➡️ Rendering arrows...');
    
    this.arrows.forEach(arrow => {
      // Scale arrow coordinates relative to the displayed image
      const startX = this.imageInfo.x + (arrow.start.x * this.imageInfo.scaleX);
      const startY = this.imageInfo.y + (arrow.start.y * this.imageInfo.scaleY);
      const endX = this.imageInfo.x + (arrow.end.x * this.imageInfo.scaleX);
      const endY = this.imageInfo.y + (arrow.end.y * this.imageInfo.scaleY);
      
      console.log(`➡️ Arrow ${arrow.id} coordinates:`, {
        original: { start: arrow.start, end: arrow.end },
        scaled: { start: { x: startX, y: startY }, end: { x: endX, y: endY } }
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
      
      // Add to arrows layer
      this.layers.content.add(arrowLine);
    });
    
    console.log(`✅ Rendered ${this.arrows.length} arrows`);
    
    // Show arrow legend if there are arrows
    this.showArrowLegend();
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
    
    // Highlight block on hover
    dropZone.addEventListener('mouseenter', () => {
      console.log(`🎯 Mouse enter on HTML drop zone for block ${block.id}`);
      const blockRect = this.layers.content.findOne(`#block_${block.id}`);
      if (blockRect) {
        blockRect.stroke('#28a745');
        blockRect.strokeWidth(3);
        this.stage.batchDraw();
      }
    });
    
    // Restore block appearance on leave
    dropZone.addEventListener('mouseleave', () => {
      console.log(`🎯 Mouse leave on HTML drop zone for block ${block.id}`);
      const blockRect = this.layers.content.findOne(`#block_${block.id}`);
      if (blockRect) {
        blockRect.stroke('#007bff');
        blockRect.strokeWidth(2);
        this.stage.batchDraw();
      }
    });
    
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
    
    // Handle drag enter
    dropZone.addEventListener('dragenter', (e) => {
      console.log(`🎯 Drag enter on HTML drop zone for block ${block.id}`);
      e.preventDefault();
      const blockRect = this.layers.content.findOne(`#block_${block.id}`);
      if (blockRect) {
        blockRect.stroke('#28a745');
        blockRect.strokeWidth(4);
        this.stage.batchDraw();
      }
    });
    
    // Handle drag leave
    dropZone.addEventListener('dragleave', (e) => {
      console.log(`🎯 Drag leave on HTML drop zone for block ${block.id}`);
      const blockRect = this.layers.content.findOne(`#block_${block.id}`);
      if (blockRect) {
        blockRect.stroke('#007bff');
        blockRect.strokeWidth(2);
        this.stage.batchDraw();
      }
    });
    
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
    this.highlightBlock(blockId, word.isCorrect);
    
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
    }
    
    // Update correct matches count - check if the removed word was correct
    if (word.isCorrect) {
      this.correctMatches--;
    }
    
    console.log(`🗑️ Removed word "${word.word}" placement from block ${blockId}`);
  }

  highlightBlock(blockId, isCorrect) {
    // Find the Konva block rectangle
    const blockRect = this.layers.content.findOne(`#block_${blockId}`);
    if (blockRect) {
      if (isCorrect) {
        // Correct placement - green
        blockRect.fill('rgba(40, 167, 69, 0.2)');
        blockRect.stroke('#28a745');
        blockRect.strokeWidth(3);
      } else {
        // Incorrect placement - red
        blockRect.fill('rgba(220, 53, 69, 0.2)');
        blockRect.stroke('#dc3545');
        blockRect.strokeWidth(3);
      }
    }
    
    this.stage.batchDraw();
  }

  removeBlockHighlight(blockId) {
    // Reset block to default appearance
    const blockRect = this.layers.content.findOne(`#block_${blockId}`);
    if (blockRect) {
      blockRect.fill('rgba(0, 123, 255, 0.1)');
      blockRect.stroke('#007bff');
      blockRect.strokeWidth(2);
    }
    
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

  showArrowLegend() {
    if (this.arrows.length === 0) return;
    
    console.log('📚 Showing arrow legend...');
    
    // Create arrow type descriptions
    const arrowTypes = [
      { type: 'directional', description: 'Points to the correct block location' },
      { type: 'connection', description: 'Shows relationship between elements' },
      { type: 'sequence', description: 'Indicates order or flow' }
    ];
    
    // Populate arrow types
    this.elements.arrowTypes.innerHTML = '';
    arrowTypes.forEach(arrowType => {
      const arrowTypeElement = document.createElement('div');
      arrowTypeElement.className = 'matching-test__arrow-type';
      arrowTypeElement.innerHTML = `
        <div class="matching-test__arrow-icon"></div>
        <div class="matching-test__arrow-description">${arrowType.description}</div>
      `;
      this.elements.arrowTypes.appendChild(arrowTypeElement);
    });
    
    // Show legend
    this.elements.arrowLegend.style.display = 'block';
  }

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
      }
      
      this.stage.batchDraw();
    }
  }

  recenterImage() {
    if (!this.imageInfo || !this.layers.background) return; // Changed from layers.image
    
    const canvasWidth = this.stage.width();
    const canvasHeight = this.stage.height();
    
    // Recalculate image position
    let imgX, imgY;
    
    if (this.imageInfo.width > this.imageInfo.height) {
      imgX = (canvasWidth - this.imageInfo.width) / 2;
      imgY = (canvasHeight - this.imageInfo.height) / 2;
    } else {
      imgX = (canvasWidth - this.imageInfo.width) / 2;
      imgY = (canvasHeight - this.imageInfo.height) / 2;
    }
    
    // Update image position
    const konvaImage = this.layers.background.getChildren()[0]; // Changed from layers.image
    if (konvaImage) {
      konvaImage.x(imgX);
      konvaImage.y(imgY);
      
      // Update stored image info
      this.imageInfo.x = imgX;
      this.imageInfo.y = imgY;
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

  resetAllBlockHighlights() {
    console.log('🔄 Resetting all block highlights...');
    
    this.blocks.forEach(block => {
      const blockRect = this.layers.content.findOne(`#block_${block.id}`);
      if (blockRect) {
        blockRect.fill('rgba(0, 123, 255, 0.1)');
        blockRect.stroke('#007bff');
        blockRect.strokeWidth(2);
      }
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
      
      // Submit to backend
      const response = await fetch('/.netlify/functions/submit-matching-type-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      
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
    // Get student ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('student_id');
    
    // This would typically come from the student's session
    // For now, using placeholder data - in production, get from authentication
    return {
      grade: 'M1',
      class: '1/15',
      number: 1,
      student_id: studentId || '51706',
      name: 'Kittikhun',
      surname: 'Siriwadtanakojaroen',
      nickname: 'Tong Tong'
    };
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
    
    // Show arrow compliance if applicable
    if (results.total_arrows > 0 && this.elements.arrowScoreItem) {
      this.elements.arrowScoreItem.style.display = 'block';
      if (this.elements.arrowCompliance) {
        this.elements.arrowCompliance.textContent = `${results.arrow_compliance}%`;
      }
    }
    
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
    
    // Add motivational message based on score
    if (scorePercentage === 100) {
      feedback += '<div style="text-align: center;"><strong>🎉 Perfect Score!</strong> Excellent work! You matched all words correctly.</div>';
    } else if (scorePercentage >= 80) {
      feedback += '<div style="text-align: center;"><strong>🌟 Great Job!</strong> You did very well on this test.</div>';
    } else if (scorePercentage >= 60) {
      feedback += '<div style="text-align: center;"><strong>👍 Good Effort!</strong> You\'re on the right track.</div>';
    } else if (scorePercentage >= 40) {
      feedback += '<div style="text-align: center;"><strong>📚 Keep Learning!</strong> Review the material and try again.</div>';
    } else {
      feedback += '<div style="text-align: center;"><strong>💪 Don\'t Give Up!</strong> Practice makes perfect.</div>';
    }
    
    if (results.total_arrows > 0) {
      feedback += `<br><br><div style="text-align: center;"><strong>Arrow Compliance:</strong> You followed ${results.arrow_compliance}% of the arrow directions correctly.</div>`;
    }
    
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
