

import React from 'react';

const iconProps = {
    width: "1em",
    height: "1em",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export const PlusIcon = () => (
    <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export const SaveIcon = () => (
    <svg {...iconProps}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

export const TrashIcon = () => (
    <svg {...iconProps}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

export const SearchIcon = () => (
    <svg {...iconProps}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export const TransposeUpIcon = () => (
    <svg {...iconProps}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

export const TransposeDownIcon = () => (
    <svg {...iconProps}><path d="M5 12h14M12 19l-7-7 7-7"/></svg>
);

export const ChordIcon = () => (
    <svg {...iconProps}><path d="M10 12.42 2.62 16a2.4 2.4 0 0 1-3.39-3.39L8.58 4A2.4 2.4 0 0 1 12 4Z"/><circle cx="12" cy="12" r="10"/></svg>
);

export const PDFIcon = () => (
    <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);

export const CloseIcon = () => (
    <svg {...iconProps}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export const SpinnerIcon = () => (
    <svg {...iconProps} className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
);

export const InfoIcon = () => (
    <svg {...iconProps}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

export const CheckCircleIcon = () => (
     <svg {...iconProps}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export const AlertTriangleIcon = () => (
    <svg {...iconProps}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

export const EyeIcon = () => (
    <svg {...iconProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export const EyeOffIcon = () => (
    <svg {...iconProps}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

export const ExportIcon = () => (
    <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 15V3"/></svg>
);

export const ImportIcon = () => (
    <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
);

export const MoreVerticalIcon = () => (
    <svg {...iconProps}><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
);

export const MusicIcon = () => (
    <svg {...iconProps}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
);

export const PlayIcon = () => (
    <svg {...iconProps} fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

export const PauseIcon = () => (
    <svg {...iconProps} fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);

export const ClipboardListIcon = () => (
    <svg {...iconProps}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>
);

export const GripVerticalIcon = () => (
    <svg {...iconProps}><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
);

export const UploadCloudIcon = () => (
    <svg {...iconProps}><path d="M16 16l-4-4-4 4M12 12v9"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><path d="M16 16l-4-4-4 4"/></svg>
);

export const XCircleIcon = () => (
    <svg {...iconProps}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);

export const MetronomeIcon = () => (
    <svg {...iconProps}><path d="m12 6-8.5 8.5a5 5 0 1 0 7 7L19 13l-7-7zM6 16l-3 3"/></svg>
);

export const FontSizeUpIcon = () => (
    <svg {...iconProps}><path d="M4 20h4l4-10.5L16 20h4"/><path d="m10 4 3 3-3 3"/></svg>
);
export const FontSizeDownIcon = () => (
    <svg {...iconProps}><path d="M4 20h4l4-10.5L16 20h4"/><path d="m10 10-3-3 3-3"/></svg>
);

export const Volume2Icon = () => (
    <svg {...iconProps}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

export const Volume1Icon = () => (
    <svg {...iconProps}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

export const VolumeXIcon = () => (
    <svg {...iconProps}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);

export const PinIcon = () => (
    <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

export const PinOffIcon = () => (
    <svg {...iconProps}><path d="m21 10-2 2m-2-2 2 2m-5-5-2 2m-2-2 2 2m-5 5c0 7 9 13 9 13s3-2 5-5m4-8a9 9 0 1 0-12.7 12.7"/><circle cx="12" cy="10" r="3"/></svg>
);

export const RotateCcwIcon = () => (
    <svg {...iconProps}><path d="M3 2v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 12"/></svg>
);

export const ArrowLeftIcon = () => (
    <svg {...iconProps}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

export const MagicWandIcon = () => (
    <svg {...iconProps} strokeWidth="1.5"><path d="m5 3 2.5 2.5M12.5 6.5 10 9M8 5l-2.5-2.5M19 12l-2.5-2.5M14 17l.5.5-2.5 2.5-5-5L9.5 7.5l.5.5L14 17Z"/></svg>
);

export const FileTextIcon = () => (
    <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);