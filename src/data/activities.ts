export type ActivityId = "british-values" | "prevent-duty";

export type Activity = {
  id: ActivityId;
  number: "01" | "02";
  title: string;
  shortTitle: string;
  description: string;
  iframeTitle: string;
  accent: "red" | "cobalt";
  contentPath: string;
};

export const activities: Activity[] = [
  {
    id: "british-values",
    number: "01",
    title: "British Values",
    shortTitle: "British Values",
    description: "Explore the principles that shape an inclusive, respectful and democratic learning community.",
    iframeTitle: "BPP British Values Activity",
    accent: "red",
    contentPath: "h5p-content/british-values",
  },
  {
    id: "prevent-duty",
    number: "02",
    title: "Prevent Duty",
    shortTitle: "Prevent Duty",
    description: "Build your awareness of Prevent Duty and the part we all play in keeping our community safe.",
    iframeTitle: "BPP Prevent Duty",
    accent: "cobalt",
    contentPath: "h5p-content/prevent-duty",
  },
];
