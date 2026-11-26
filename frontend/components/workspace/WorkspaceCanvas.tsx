"use client";

import { useEffect } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import ArchitectureNode from "./ArchitectureNode";

import { getComponentByType } from "@/data/architectureComponents";

interface WorkspaceCanvasProps {
  snapshotKey?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onGraphChange?: (nodes: Node[], edges: Edge[]) => void;
  highlightNodeIds?: string[];
  readOnly?: boolean;
}

const nodeTypes = {
  api: ArchitectureNode,
  database: ArchitectureNode,
  cache: ArchitectureNode,
  loadbalancer: ArchitectureNode,
  queue: ArchitectureNode,
};

function CanvasInner({
  initialNodes = [],
  initialEdges = [],
  onGraphChange,
  highlightNodeIds = [],
  readOnly = false,
}: WorkspaceCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    onGraphChange?.(nodes, edges);
  }, [nodes, edges, onGraphChange]);

  const highlighted = new Set(highlightNodeIds);

  const displayNodes = highlighted.size
    ? nodes.map((node) =>
        highlighted.has(node.id)
          ? { ...node, className: "issue-highlight" }
          : node
      )
    : nodes;

  const onConnect: OnConnect = (connection: Connection) => {
    if (readOnly) return;

    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#006aff",
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#64748b",
            width: 18,
            height: 18,
          },
        },
        currentEdges
      )
    );
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (readOnly) return;

    const componentType = event.dataTransfer.getData("application/reactflow");
    if (!componentType) return;

    const component = getComponentByType(componentType);
    if (!component) {
      console.warn(`Unknown component: ${componentType}`);
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      position,
      data: {
        label: component.name,
        componentType: component.type,
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = readOnly ? "none" : "move";
  };

  const getMiniMapColor = (node: Node) => {
    const component = getComponentByType(node.type || "");
    return component?.colors.minimap || "#64748b";
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#08090b]"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={onConnect}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background color="#25282d" gap={24} size={1} />

        <Controls
          position="bottom-right"
          className="architecture-controls !mb-4 !mr-4 !overflow-hidden !rounded-xl !border !border-gray-700 !bg-[#11151c] !shadow-2xl"
        />

        <MiniMap
          position="bottom-left"
          className="!mb-4 !ml-4 !overflow-hidden !rounded-xl !border !border-gray-800 !bg-[#11151c]"
          nodeColor={getMiniMapColor}
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>

      {/* Canvas Status */}
      <div className="pointer-events-none absolute left-5 top-5 z-10">
        <div className="rounded-xl border border-gray-800 bg-gray-900/90 px-4 py-3 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div
              className={`h-2 w-2 rounded-full ${
                readOnly
                  ? "bg-amber-400 shadow-lg shadow-amber-400/50"
                  : "bg-green-400 shadow-lg shadow-green-400/50"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-white">
                {readOnly ? "Read-Only Snapshot" : "Architecture Canvas"}
              </p>
              <p className="text-xs text-gray-500">
                {readOnly
                  ? "Restore to draft to edit"
                  : "Drag components here"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty Canvas */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 text-xl text-gray-400">
              +
            </div>
            <p className="mt-4 text-sm font-medium text-gray-400">
              Start designing your architecture
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Drag a component from the sidebar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceCanvas(props: WorkspaceCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner key={props.snapshotKey} {...props} />
    </ReactFlowProvider>
  );
}