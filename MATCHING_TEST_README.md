# Matching Type Test Implementation

## Overview

This document describes the implementation of matching type tests for the student cabinet using Konva.js. The system allows students to take matching tests where they drag words to match them with blocks on an image.

## Features

- **Interactive Canvas**: Konva.js-based canvas displaying the test image
- **Draggable Words**: Words below the canvas that can be dragged and dropped
- **Visual Blocks**: Highlighted areas on the image where words should be matched
- **Arrow Support**: Optional arrows can be displayed on the image
- **Progress Tracking**: Real-time progress display showing matched words
- **Submit Validation**: Submit button only enabled when all words are matched
- **Responsive Design**: Mobile-friendly interface

## Database Schema Compliance

The implementation follows the database schema exactly:

### Tables Used
- `matching_type_tests` - Test metadata (id, teacher_id, test_name, image_url, num_blocks, created_at)
- `matching_type_test_questions` - Individual questions with block coordinates and words
- `matching_type_test_arrows` - Arrow information for visual guidance
- `matching_type_test_results` - Student submission results

### Key Fields
- `question_id` - Unique identifier for each question
- `word` - The word to be matched
- `block_coordinates` - JSON object with x, y, width, height
- `has_arrow` - Boolean indicating if arrow exists
- `arrow` - Arrow coordinates and styling (if applicable)

## Implementation Details

### 1. Frontend Rendering (`renderMatchingTypeQuestionsForPage`)

Creates the HTML structure for the matching test:
- Canvas container for Konva.js
- Words grid below the canvas
- Progress display and submit button

### 2. Konva.js Initialization (`initializeMatchingTest`)

- Loads Konva.js library dynamically
- Fetches test data from backend
- Creates canvas with proper dimensions
- Sets up layers for different elements

### 3. Block and Arrow Rendering (`renderMatchingBlocksAndArrows`)

- Renders blocks on the canvas based on coordinates
- Adds block numbers for identification
- Renders arrows if they exist
- Scales everything according to image dimensions

### 4. Word Rendering (`renderDraggableWords`)

- Creates draggable word elements
- Sets up drag and drop event handlers
- Creates invisible drop zones on blocks
- Handles drag enter/leave visual feedback

### 5. Drop Handling (`handleWordDrop`)

- Validates if word matches the correct block
- Updates visual state of matched words
- Tracks progress and completion
- Stores matches in localStorage

### 6. Progress Tracking

- Real-time count of matched words
- Visual feedback for completion status
- Submit button state management
- Progress persistence

## Usage Flow

### For Students

1. **Start Test**: Student selects a matching type test from their cabinet
2. **View Image**: Test image is displayed with highlighted blocks
3. **Drag Words**: Student drags words from the bottom to match with blocks
4. **Visual Feedback**: Blocks highlight when words are dragged over them
5. **Progress Tracking**: Progress bar shows completion status
6. **Submit**: Submit button enables when all words are matched
7. **Results**: Test is submitted and results are recorded

### For Teachers

1. **Create Test**: Use the existing `matching-test-bundle.js` interface
2. **Upload Image**: Upload an image for the test
3. **Add Blocks**: Click and drag to create blocks on the image
4. **Add Words**: Enter words that correspond to each block
5. **Add Arrows**: Optionally add arrows for visual guidance
6. **Save Test**: Test is saved to database with all metadata

## Technical Implementation

### Konva.js Integration

- **Stage**: Main canvas container (800x600 default)
- **Layers**: Separate layers for background, image, blocks, arrows, and words
- **Scaling**: Automatic scaling based on image dimensions
- **Event Handling**: Proper drag and drop with visual feedback

### Drag and Drop

- **HTML5 Drag API**: Native browser drag and drop
- **Data Transfer**: JSON data containing question ID and word
- **Drop Zones**: Invisible areas on blocks for accepting drops
- **Validation**: Ensures words are dropped on correct blocks

### State Management

- **Global State**: `window.matchingTestData` stores test information
- **Progress Tracking**: Real-time updates via DOM manipulation
- **Local Storage**: Persists progress and matches
- **Event Handling**: Proper cleanup and memory management

## CSS Styling

The implementation includes comprehensive CSS styling:

- **Responsive Grid**: Words are displayed in a responsive grid
- **Visual States**: Different styles for normal, hover, dragging, and matched states
- **Animations**: Smooth transitions and hover effects
- **Mobile Support**: Responsive design for different screen sizes

## Error Handling

- **Konva.js Loading**: Graceful fallback if library fails to load
- **Image Loading**: Error handling for failed image loads
- **Data Validation**: Checks for required test data
- **User Feedback**: Clear error messages and alerts

## Testing

A demo file (`test-matching.html`) is provided for testing:
- Standalone HTML file with sample data
- Demonstrates all functionality
- Can be opened directly in browser
- Includes sample matching test with 4 words

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Touch devices with drag and drop
- **Fallbacks**: Graceful degradation for older browsers

## Performance Considerations

- **Canvas Optimization**: Efficient rendering with Konva.js
- **Event Delegation**: Proper event handling for multiple elements
- **Memory Management**: Cleanup of event listeners and objects
- **Lazy Loading**: Konva.js loaded only when needed

## Security

- **Input Validation**: All user inputs are validated
- **XSS Prevention**: Safe handling of dynamic content
- **Data Sanitization**: Proper escaping of user-generated content

## Future Enhancements

- **Audio Support**: Sound effects for matches
- **Animation**: Smooth animations for word movements
- **Accessibility**: Better screen reader support
- **Offline Support**: Progress saving without internet
- **Multi-language**: Support for different languages

## Troubleshooting

### Common Issues

1. **Konva.js not loading**: Check internet connection and CDN availability
2. **Drag and drop not working**: Ensure browser supports HTML5 drag and drop
3. **Image not displaying**: Check image URL and CORS settings
4. **Blocks not visible**: Verify block coordinates are within canvas bounds

### Debug Information

The implementation includes extensive console logging:
- Test data loading
- Canvas initialization
- Drag and drop events
- Progress updates
- Error conditions

## Conclusion

The matching type test implementation provides a robust, user-friendly interface for students to take matching tests. It follows the database schema exactly, provides comprehensive error handling, and includes responsive design for all devices. The Konva.js integration ensures smooth performance and professional appearance.
