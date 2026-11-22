"use client";

import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

import {
  getComponentByType,
} from "@/data/architectureComponents";

interface ArchitectureNodeData {
  label: string;
  componentType?: string;
}

export default function ArchitectureNode({
  data,
}: NodeProps) {
  const nodeData = data as unknown as ArchitectureNodeData;

  const component = getComponentByType(
    nodeData.componentType || ""
  );

  // Fallback
  if (!component) {
    return (
      <div className="relative w-[190px] rounded-xl border border-gray-700 bg-[#11151c] p-4 text-white shadow-2xl">
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-gray-950 !bg-gray-500"
        />

        <p className="text-sm font-semibold">
          {nodeData.label}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Architecture component
        </p>

        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-gray-950 !bg-gray-500"
        />
      </div>
    );
  }

  return (
    <div className="relative w-[210px] overflow-hidden rounded-xl border border-gray-700 bg-[#11151c] shadow-2xl transition-all hover:border-gray-500">
      
      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3 !w-3 !border-2 !border-gray-950 ${component.colors.handle}`}
      />

      {/* Header */}
      <div
        className={`flex items-center gap-3 border-b border-gray-800 px-4 py-3 ${component.colors.bg}`}
      >
        {/* Icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${component.colors.iconBg} ${component.colors.text}`}
        >
          {component.short}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {component.name}
          </p>

          <p className="mt-0.5 text-[11px] text-gray-500">
            {component.description}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Category
          </span>

          <span className="text-gray-300">
            {component.category}
          </span>
        </div>
      </div>

      {/* Output */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!h-3 !w-3 !border-2 !border-gray-950 ${component.colors.handle}`}
      />
    </div>
  );
}