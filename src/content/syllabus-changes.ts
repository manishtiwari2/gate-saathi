/**
 * GATE 2027 syllabus/paper changes, each traced to the official brochure.
 * Source for all: GATE 2027 Information Brochure (IIT Madras, revised 27 Sep 2026).
 * Verified on 2026-10-02. Captured from the reference site during the audit.
 */
export const SYLLABUS_SOURCE_URL = "https://gate2027ib.iitm.ac.in/GATE2027-IB.pdf";
export const SYLLABUS_VERIFIED_ON = "2026-10-02";

/**
 * GATE 2027 exam days, from the same brochure (see the "exam-dates" item
 * below). Kept as data so the countdown and the checklist can't disagree.
 */
export const GATE_2027_EXAM_DAYS = [
  "2027-02-06",
  "2027-02-07",
  "2027-02-13",
  "2027-02-14",
  "2027-02-20",
  "2027-02-21",
] as const;

export interface SyllabusChange {
  id: string;
  tags: string[];
  category: string;
  title: string;
  detail: string;
}

export const SYLLABUS_CHANGES: SyllabusChange[] = [
  {
    id: "syllabi-revised",
    tags: ["ALL"],
    category: "Syllabus",
    title: "Syllabi of most papers revised",
    detail:
      "The organizing institute states that the syllabus of GATE 2027 test papers has been revised and that the syllabi for most test papers changed. Re-check your paper's official GATE 2027 syllabus before planning revision.",
  },
  {
    id: "new-ra-paper",
    tags: ["RA"],
    category: "New paper",
    title: "New paper: Robotics and Automation (RA)",
    detail:
      "New test paper. Apart from General Aptitude: Part A (common, 60 marks, 39 questions) plus one of Part B1 Electrical or Part B2 Mechanical (25 marks, 16 questions), chosen during the exam. Part A covers Engineering Mathematics and Basics of Mechatronics.",
  },
  {
    id: "tf-into-xe9",
    tags: ["TF", "XE"],
    category: "Structure",
    title: "Textile (TF) becomes XE section XE9",
    detail:
      "TF is no longer a separate paper. Textile Engineering and Fibre Science is now XE9, an optional section of the XE paper (sections: Textile Fibres; Yarn Manufacture; Fabric Manufacture; Textile Testing; Chemical Processing).",
  },
  {
    id: "xe-renumber",
    tags: ["XE"],
    category: "Paper code",
    title: "XE section codes renamed",
    detail:
      "The common Engineering Mathematics section is now XE0 and the optional sections are numbered XE1 to XE9, with Textile as XE9. Candidates answer XE0 plus at most two of XE1 to XE9. See the brochure's paper table for the full old-to-new mapping.",
  },
  {
    id: "xh-renumber",
    tags: ["XH"],
    category: "Paper code",
    title: "XH section codes renamed",
    detail:
      "XH-B1 (Reasoning and Comprehension, common) is now XH0; XH-C1 to XH-C6 are now XH1 to XH6.",
  },
  {
    id: "xl-renumber",
    tags: ["XL"],
    category: "Paper code",
    title: "XL section codes renamed",
    detail: "XL-P (Chemistry, common) is now XL0; XL-Q to XL-U are now XL1 to XL5.",
  },
  {
    id: "bt-sections",
    tags: ["BT"],
    category: "Syllabus",
    title: "BT: syllabus organized into 6 sections",
    detail:
      "The GATE 2027 BT syllabus has 6 sections, with bioreaction and bioprocess topics under Section 4, Fundamentals of Biological Engineering. Compare with your previous BT syllabus for topic-level differences.",
  },
  {
    id: "combinations",
    tags: ["ALL"],
    category: "Structure",
    title: "Two-paper combinations list updated (tentative)",
    detail:
      "The allowed primary/secondary paper combinations include the new RA paper (for example CS, EC, EE, IN and ME can pair with RA). The list is marked tentative and subject to change.",
  },
  {
    id: "registration",
    tags: ["ALL"],
    category: "Process",
    title: "Registration: live facial capture and DigiLocker",
    detail:
      "Applicants must provide live facial details during registration. A verified DigiLocker account is recommended; unverified accounts may be asked for additional documents.",
  },
  {
    id: "exam-dates",
    tags: ["ALL"],
    category: "Process",
    title: "Exam dates",
    detail:
      "GATE 2027 is scheduled for February 6, 7, 13, 14, 20 and 21, 2027 (forenoon and afternoon sessions).",
  },
];
