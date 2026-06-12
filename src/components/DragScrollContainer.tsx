"use client";

import React, { useRef, useState, MouseEvent } from "react";

interface DragScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DragScrollContainer({ children, className, style }: DragScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDown(true);
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
      setStartX(e.pageX - containerRef.current.offsetLeft);
      setScrollLeft(containerRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseUp = () => {
    setIsDown(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDown) return;
    
    const x = e.pageX - (containerRef.current ? containerRef.current.offsetLeft : 0);
    const distance = Math.abs(x - startX);
    
    // 미세한 움직임은 드래그로 인지하지 않고 클릭도 가능하도록 5px 가드 적용
    if (distance > 5) {
      setIsDragging(true);
      e.preventDefault(); // 텍스트 영역 선택 및 드래그 방지
      if (containerRef.current) {
        const walk = (x - startX) * 1.5; // 드래그 가속도 계수 1.5
        containerRef.current.scrollLeft = scrollLeft - walk;
      }
    }
  };

  // 브라우저의 기본 이미지/링크 드래그 섀도우 동작 차단 (PC 드래그 스크롤 필수 가드)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 링크 클릭 시 드래그 동작 중이었으면 상세페이지 이동 링크가 바로 실행되지 않도록 방지
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onDragStart={handleDragStart}
      onClickCapture={handleClick}
      style={{ 
        cursor: "grab", 
        userSelect: "none",
        ...style 
      }}
    >
      {children}
    </div>
  );
}

