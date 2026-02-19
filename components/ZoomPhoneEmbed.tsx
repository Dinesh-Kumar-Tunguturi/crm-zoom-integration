"use client";

import React, { useState, useEffect, useRef } from "react";
import { Phone, X, Minimize2, Maximize2, PhoneCall, ExternalLink, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ZoomPhoneEmbedProps {
    onIncomingCall?: (data: any) => void;
    onCallEnd?: (data: any) => void;
    onConnect?: (data: any) => void;
    callerEmail?: string;
}

// Define the handle interface
export interface ZoomPhoneEmbedHandle {
    dial: (phoneNumber: string) => void;
}

// Helper: Check if user is on a mobile device
const isMobileDevice = () => {
    if (typeof navigator === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export const ZoomPhoneEmbed = React.forwardRef<ZoomPhoneEmbedHandle, ZoomPhoneEmbedProps>(({
    onIncomingCall,
    onCallEnd,
    onConnect,
    callerEmail,
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [embedUrl, setEmbedUrl] = useState("");
    const [callStatus, setCallStatus] = useState<string>("");
    const [lastDialedNumber, setLastDialedNumber] = useState<string>("");
    const [showFallback, setShowFallback] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ─── DIAL METHOD (HYBRID) ──────────────────────────────────
    const dialNumber = (phoneNumber: string) => {
        if (!phoneNumber) return;

        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");
        setLastDialedNumber(cleanNumber);
        setShowFallback(false);

        // ── MOBILE: Use tel: protocol directly ──
        if (isMobileDevice()) {
            window.location.href = `tel:${cleanNumber}`;
            return;
        }

        // ── DESKTOP: Open widget and try Smart Embed ──
        setIsOpen(true);
        setIsMinimized(false);
        setCallStatus("Calling via Zoom...");

        // Try Smart Embed iframe
        if (iframeRef.current && iframeRef.current.contentWindow) {
            const payload = {
                type: 'zp-make-call',
                data: { number: cleanNumber }
            };
            iframeRef.current.contentWindow.postMessage(payload, '*');
        }

        // After 8 seconds, if still "Calling...", show fallback options
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = setTimeout(() => {
            setShowFallback(true);
        }, 8000);
    };

    // Expose the 'dial' method to the parent
    React.useImperativeHandle(ref, () => ({
        dial: dialNumber
    }));

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    useEffect(() => {
        setEmbedUrl(`https://applications.zoom.us/integration/phone/embeddablephone/home?origin=${window.location.origin}`);
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type, data } = event.data || {};

            if (!type || typeof type !== 'string') return;

            if (type.startsWith('zp-')) {
                console.log(`[Zoom Phone Event] ${type}:`, data);
            }

            switch (type) {
                case "zp-call-ringing-event":
                    if (onIncomingCall) onIncomingCall(data);
                    if (!isOpen) setIsOpen(true);
                    setCallStatus("Ringing...");
                    setShowFallback(false);
                    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
                    break;
                case "zp-call-connected-event":
                    if (onConnect) onConnect(data);
                    setCallStatus("Connected");
                    setShowFallback(false);
                    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
                    break;
                case "zp-call-ended-event":
                    if (onCallEnd) onCallEnd(data);
                    setCallStatus("");
                    setLastDialedNumber("");
                    setShowFallback(false);
                    break;
                case "zp-init-success-event":
                    setIframeLoaded(true);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        };
    }, [onIncomingCall, onCallEnd, onConnect, isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Smart Embed Drawer/Modal */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden bg-white shadow-2xl rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800",
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none",
                    isMinimized ? "w-64 h-16" : "w-[375px] h-[600px]"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 h-12">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Zoom Phone
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={toggleMinimize}
                        >
                            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-red-500"
                            onClick={() => { setIsOpen(false); setCallStatus(""); setShowFallback(false); }}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className={cn("relative w-full h-full bg-gray-100", isMinimized && "hidden")}>
                    {!iframeLoaded && !loadError && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            Loading Zoom Phone...
                        </div>
                    )}

                    {embedUrl && (
                        <iframe
                            ref={iframeRef}
                            src={embedUrl}
                            className="w-full h-[calc(100%-3rem)] border-none"
                            allow="microphone *; camera *; clipboard-write *; autoplay *; speaker-selection *; display-capture *"
                            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
                            onLoad={() => setIframeLoaded(true)}
                            onError={() => setLoadError(true)}
                        />
                    )}

                    {/* ─── FALLBACK UI ─── */}
                    {/* Shown when call is stuck OR "No available device" */}
                    {(showFallback || loadError) && lastDialedNumber && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 text-center z-10">
                            <PhoneCall className="h-12 w-12 text-blue-500 mb-4 animate-pulse" />
                            <p className="text-lg font-semibold text-gray-800 mb-1">Call {lastDialedNumber}</p>
                            <p className="text-sm text-gray-500 mb-6">
                                The browser call is not connecting. Use one of these options:
                            </p>

                            {/* Option 1: Open via Zoom Desktop App (tel: protocol) */}
                            <Button
                                className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                    window.location.href = `tel:${lastDialedNumber}`;
                                }}
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                Call via Zoom Desktop App
                            </Button>

                            {/* Option 2: Open Zoom Phone Web */}
                            <Button
                                variant="outline"
                                className="w-full mb-3"
                                onClick={() => {
                                    window.open(`https://app.zoom.us/wc/phone`, "_blank");
                                }}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Zoom Phone in New Tab
                            </Button>

                            {/* Option 3: Copy number for Zoom Mobile App */}
                            <Button
                                variant="outline"
                                className="w-full mb-3"
                                onClick={() => {
                                    navigator.clipboard.writeText(lastDialedNumber);
                                    alert(`Number copied: ${lastDialedNumber}\nOpen Zoom Mobile App and paste to dial.`);
                                }}
                            >
                                <Smartphone className="h-4 w-4 mr-2" />
                                Copy Number for Zoom Mobile
                            </Button>

                            <p className="text-xs text-gray-400 mt-2">
                                Network may be blocking browser calls. Use the Zoom App instead.
                            </p>
                        </div>
                    )}

                    {/* Generic load error (no number dialed) */}
                    {loadError && !lastDialedNumber && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
                            <p className="text-red-500 font-medium mb-2">Unable to load Zoom Phone</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Please ensure you are logged into Zoom and have whitelisted this domain in the App Marketplace.
                            </p>
                            <Button variant="outline" size="sm" onClick={() => window.open("https://zoom.us/signin", "_blank")}>
                                Zoom Login
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Toggle Button */}
            <Button
                onClick={toggleOpen}
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                    isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-blue-600 hover:bg-blue-700 animate-pulse-subtle"
                )}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <Phone className="h-6 w-6 text-white" />
                )}
            </Button>

            {/* CSS for subtle pulse */}
            <style jsx>{`
            @keyframes pulse-subtle {
                0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
                100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
            }
            .animate-pulse-subtle {
                animation: pulse-subtle 2s infinite;
            }
        `}</style>
        </div>
    );
});

ZoomPhoneEmbed.displayName = "ZoomPhoneEmbed";
