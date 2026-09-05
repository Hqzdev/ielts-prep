"use client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ReactFlow,
  MarkerType,
  Background,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TaskVisual, Task } from "@/domain/task";

const colors = [
  "var(--reading)",
  "var(--heading)",
  "var(--listening-ink)",
  "var(--success)",
  "var(--writing-ink)",
];
export function TaskChart({ visual }: { visual: TaskVisual }) {
  if (visual.chartType === "process_diagram") {
    const cyclic = visual.processKind === "cyclical";
    const count = visual.processSteps.length;
    const nodes: Node[] = visual.processSteps.map((label, index) => ({
      id: String(index),
      position: cyclic
        ? {
            x:
              180 + 150 * Math.cos((index / count) * Math.PI * 2 - Math.PI / 2),
            y:
              190 + 170 * Math.sin((index / count) * Math.PI * 2 - Math.PI / 2),
          }
        : { x: (index % 2) * 190, y: Math.floor(index / 2) * 115 },
      data: { label: `${index + 1}. ${label}` },
      style: {
        width: 165,
        border: "1px solid var(--border-control)",
        borderRadius: 16,
        padding: 12,
        fontSize: 12,
        background: "var(--surface)",
        color: "var(--ink)",
      },
    }));
    const edges: Edge[] = visual.processSteps.flatMap((_, index) =>
      index < count - 1 || cyclic
        ? [
            {
              id: `e${index}`,
              source: String(index),
              target: String((index + 1) % count),
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "var(--reading)",
              },
              style: { stroke: "var(--reading)" },
              type: "smoothstep",
            },
          ]
        : [],
    );
    return (
      <div className="process-diagram" aria-label={visual.title}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          preventScrolling={false}
          fitViewOptions={{ padding: 0.12 }}
        >
          <Background color="var(--border)" gap={20} />
        </ReactFlow>
      </div>
    );
  }
  if (visual.chartType === "table")
    return (
      <div className="visual-table">
        <table>
          <caption>
            {visual.title}
            {visual.unit ? ` (${visual.unit})` : ""}
          </caption>
          <thead>
            <tr>
              <th>Category</th>
              {visual.periods.map((p) => (
                <th key={p}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visual.dataSeries.map((series) => (
              <tr key={series.category}>
                <th>{series.category}</th>
                {visual.periods.map((p) => (
                  <td key={p}>{series.values[p]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  const data = visual.periods.map((period) => ({
    name: period,
    ...Object.fromEntries(
      visual.dataSeries.map((series) => [
        series.category,
        series.values[period],
      ]),
    ),
  }));
  if (visual.chartType === "pie_chart")
    return (
      <div className="stack" style={{ marginTop: 24 }}>
        {visual.periods.map((period) => (
          <div key={period}>
            <p
              className="small muted"
              style={{ textAlign: "center", margin: 0 }}
            >
              {period} · {visual.unit}
            </p>
            <div className="chart-wrap" style={{ height: 260, margin: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={visual.dataSeries.map((series) => ({
                      name: series.category,
                      value: series.values[period],
                    }))}
                    dataKey="value"
                    nameKey="name"
                    label={({ value }) => `${value}`}
                    outerRadius={70}
                  >
                    {visual.dataSeries.map((series, index) => (
                      <Cell
                        key={series.category}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <>
      <p className="small muted" style={{ marginTop: 20, marginBottom: 0 }}>
        {visual.unit}
      </p>
      <div className="chart-wrap">
        <ResponsiveContainer>
          {visual.chartType === "bar_chart" ? (
            <BarChart
              data={data}
              margin={{ top: 8, right: 5, left: -20, bottom: 8 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={8} />
              {visual.dataSeries.map((series, index) => (
                <Bar
                  key={series.category}
                  dataKey={series.category}
                  fill={colors[index % colors.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 8, right: 5, left: -20, bottom: 8 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={8} />
              {visual.dataSeries.map((series, index) => (
                <Line
                  key={series.category}
                  type="linear"
                  dataKey={series.category}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </>
  );
}

export function ReadingDiagram({
  diagram,
}: {
  diagram: NonNullable<Task["diagram"]>;
}) {
  return (
    <div className="reading-diagram" aria-label={diagram.title}>
      <ReactFlow
        nodes={diagram.nodes.map((node) => ({
          id: node.id,
          position: { x: node.x, y: node.y },
          data: {
            label: (
              <span>
                {node.label}
                <br />
                <strong>{node.questionNumber}. ______</strong>
              </span>
            ),
          },
          style: {
            width: 210,
            border: "1px solid var(--border-control)",
            borderRadius: 7,
            fontSize: 12,
            background: "var(--surface)",
            padding: 12,
          },
        }))}
        edges={diagram.edges.map((edge, index) => ({
          id: String(index),
          ...edge,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "var(--reading)" },
        }))}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        preventScrolling={false}
      />
    </div>
  );
}
