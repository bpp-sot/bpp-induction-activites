export type ActivityId = "british-values" | "prevent-duty";

export type Activity = {
  id: ActivityId;
  number: "01" | "02";
  title: string;
  shortTitle: string;
  description: string;
  iframeTitle: string;
  embedUrl: string;
  accent: "red" | "cobalt";
  pledge: string;
};

export const activities: Activity[] = [
  {
    id: "british-values",
    number: "01",
    title: "British Values",
    shortTitle: "British Values",
    description: "Explore the principles that shape an inclusive, respectful and democratic learning community.",
    iframeTitle: "BPP British Values Activity",
    embedUrl: "https://estio.h5p.com/content/1292030108558809267/embed",
    accent: "red",
    pledge: "I confirm that I have completed the British Values activity and reflected on how it applies to my role at BPP.",
  },
  {
    id: "prevent-duty",
    number: "02",
    title: "Prevent Duty",
    shortTitle: "Prevent Duty",
    description: "Build your awareness of Prevent Duty and the part we all play in keeping our community safe.",
    iframeTitle: "BPP Prevent Duty",
    embedUrl: "https://estio.h5p.com/content/1292030267340169447/embed",
    accent: "cobalt",
    pledge: "I confirm that I have completed the Prevent Duty activity and understand my responsibility to raise concerns appropriately.",
  },
];
