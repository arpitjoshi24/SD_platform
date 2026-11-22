export interface ArchitectureComponent {
  type: string;
  name: string;
  short: string;
  description: string;
  category: string;

  colors: {
    bg: string;
    iconBg: string;
    text: string;
    handle: string;
    minimap: string;
  };
}

export const architectureComponents: ArchitectureComponent[] = [
  {
    type: "api",
    name: "API Server",
    short: "API",
    description: "REST API service",
    category: "Compute",

    colors: {
      bg: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      text: "text-blue-400",
      handle: "!bg-blue-500",
      minimap: "#3b82f6",
    },
  },

  {
    type: "database",
    name: "Database",
    short: "DB",
    description: "Persistent data storage",
    category: "Storage",

    colors: {
      bg: "bg-green-500/10",
      iconBg: "bg-green-500/20",
      text: "text-green-400",
      handle: "!bg-green-500",
      minimap: "#22c55e",
    },
  },

  {
    type: "cache",
    name: "Cache",
    short: "C",
    description: "In-memory data storage",
    category: "Storage",

    colors: {
      bg: "bg-purple-500/10",
      iconBg: "bg-purple-500/20",
      text: "text-purple-400",
      handle: "!bg-purple-500",
      minimap: "#a855f7",
    },
  },

  {
    type: "loadbalancer",
    name: "Load Balancer",
    short: "LB",
    description: "Distributes incoming traffic",
    category: "Networking",

    colors: {
      bg: "bg-orange-500/10",
      iconBg: "bg-orange-500/20",
      text: "text-orange-400",
      handle: "!bg-orange-500",
      minimap: "#f97316",
    },
  },

  {
    type: "queue",
    name: "Message Queue",
    short: "Q",
    description: "Asynchronous task processing",
    category: "Messaging",

    colors: {
      bg: "bg-yellow-500/10",
      iconBg: "bg-yellow-500/20",
      text: "text-yellow-400",
      handle: "!bg-yellow-500",
      minimap: "#eab308",
    },
  },
];

export const getComponentByType = (type: string) => {
  return architectureComponents.find(
    (component) => component.type === type
  );
};