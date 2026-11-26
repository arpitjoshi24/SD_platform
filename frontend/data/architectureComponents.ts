export interface ArchitectureComponent {
  type: string;
  name: string;
  short: string;
  code: string;
  description: string;
  category: string;

  colors: {
    strip: string;
    bg: string;
    iconBg: string;
    text: string;
    border: string;
    handle: string;
    minimap: string;
  };
}

export const architectureComponents: ArchitectureComponent[] = [
  {
    type: "api",
    name: "API Server",
    short: "API",
    code: "API_01",
    description: "REST / RPC service endpoint",
    category: "Compute",
    colors: {
      strip: "bg-cyan-400",
      bg: "bg-cyan-500/[0.07]",
      iconBg: "bg-cyan-500/15",
      text: "text-cyan-400",
      border: "border-cyan-500/35",
      handle: "!bg-cyan-400",
      minimap: "#06b6d4",
    },
  },
  {
    type: "loadbalancer",
    name: "Load Balancer",
    short: "LB",
    code: "LB_01",
    description: "Distributes incoming traffic",
    category: "Networking",
    colors: {
      strip: "bg-emerald-400",
      bg: "bg-emerald-500/[0.07]",
      iconBg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/35",
      handle: "!bg-emerald-400",
      minimap: "#10b981",
    },
  },
  {
    type: "database",
    name: "Database",
    short: "DB",
    code: "DB_01",
    description: "Persistent data storage",
    category: "Storage",
    colors: {
      strip: "bg-amber-400",
      bg: "bg-amber-500/[0.07]",
      iconBg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/35",
      handle: "!bg-amber-400",
      minimap: "#f59e0b",
    },
  },
  {
    type: "queue",
    name: "Message Queue",
    short: "Q",
    code: "MQ_01",
    description: "Asynchronous event & task stream",
    category: "Messaging",
    colors: {
      strip: "bg-violet-400",
      bg: "bg-violet-500/[0.07]",
      iconBg: "bg-violet-500/15",
      text: "text-violet-400",
      border: "border-violet-500/35",
      handle: "!bg-violet-400",
      minimap: "#a855f7",
    },
  },
  {
    type: "cache",
    name: "Cache",
    short: "C",
    code: "CH_01",
    description: "Low-latency in-memory store",
    category: "Storage",
    colors: {
      strip: "bg-rose-400",
      bg: "bg-rose-500/[0.07]",
      iconBg: "bg-rose-500/15",
      text: "text-rose-400",
      border: "border-rose-500/35",
      handle: "!bg-rose-400",
      minimap: "#f43f5e",
    },
  },
];

export const getComponentByType = (type: string) => {
  return architectureComponents.find(
    (component) => component.type === type
  );
};