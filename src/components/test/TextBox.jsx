import React, { useRef, useState, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';

const TextBox = ({ 
  id, 
  x, 
  y, 
  width, 
  height, 
  text, 
  fontSize,
  color,
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete 
}) => {
  // ✅ Individual drag state for this TextBox instance
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const longPressTimer = useRef(null);

  const enableDrag = () => {
    setIsDragEnabled(true);
  };

  const disableDrag = () => {
    setIsDragEnabled(false);
  };

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ✅ Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const handleDoubleClick = (e) => {
    e.cancelBubble = true;
    onUpdate(id, { isEditing: true });
  };
  
  const handleDragEnd = (e) => {
    onUpdate(id, { 
      x: e.target.x(), 
      y: e.target.y() 
    });
  };
  
  return (
    <Group
      x={x}
      y={y}
      draggable={isDragEnabled}  // ✅ Individual drag state
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(id);
      }}
      onDblClick={handleDoubleClick}  // ✅ Desktop double-click
      onDblTap={handleDoubleClick}     // ✅ Mobile double-tap
      onPointerDown={(e) => {          // ✅ Long-press activation
        e.cancelBubble = true;
        clearTimer(); // Clear any existing timer
        longPressTimer.current = setTimeout(() => {
          enableDrag();
        }, 400);
      }}
      onPointerUp={(e) => {            // ✅ Immediate cleanup
        e.cancelBubble = true;
        clearTimer();
        disableDrag(); // Immediate disable, no setTimeout
      }}
      onPointerLeave={() => {          // ✅ Immediate cleanup on leave
        clearTimer();
        disableDrag(); // Immediate disable
      }}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={width}
        height={height}
        fill={isSelected ? "#fef3c7" : "#ffffff"}
        stroke={isSelected ? "#f59e0b" : "#d1d5db"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={6}
        shadowColor="black"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
      />
      <Text
        text={text}
        width={width}
        height={height}
        padding={8}
        align="left"
        verticalAlign="top"
        fontSize={fontSize}
        fill={color}
        wrap="word"
      />
    </Group>
  );
};

export default TextBox;
