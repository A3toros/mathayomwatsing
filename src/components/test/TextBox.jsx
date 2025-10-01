import React from 'react';
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
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(id);
      }}
      onDblClick={handleDoubleClick}
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
