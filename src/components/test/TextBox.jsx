import React, { useRef } from 'react';
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
  // ✅ Add drag state management
  const dragEnabledFor = useRef(new Set());
  const longPressTimers = useRef(new Map());

  const enableDragForIndex = (index) => {
    dragEnabledFor.current.add(index);
  };

  const disableDragForIndex = (index) => {
    dragEnabledFor.current.delete(index);
  };

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
      draggable={dragEnabledFor.current.has(id)}  // ✅ Conditional dragging
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(id);
      }}
      onDblClick={handleDoubleClick}  // ✅ Desktop double-click
      onDblTap={handleDoubleClick}     // ✅ Mobile double-tap
      onPointerDown={(e) => {          // ✅ Long-press activation
        e.cancelBubble = true;
        const timerId = setTimeout(() => {
          enableDragForIndex(id);
        }, 400);
        longPressTimers.current.set(id, timerId);
      }}
      onPointerUp={(e) => {            // ✅ Timer cleanup
        e.cancelBubble = true;
        const timerId = longPressTimers.current.get(id);
        if (timerId) {
          clearTimeout(timerId);
          longPressTimers.current.delete(id);
        }
        setTimeout(() => disableDragForIndex(id), 0);
      }}
      onPointerLeave={() => {          // ✅ Timer cleanup on leave
        const timerId = longPressTimers.current.get(id);
        if (timerId) {
          clearTimeout(timerId);
          longPressTimers.current.delete(id);
        }
        disableDragForIndex(id);
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
