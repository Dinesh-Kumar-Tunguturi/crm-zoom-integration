"use client";

import React, { useState, useEffect, useRef } from "react";
import { Phone, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ZoomPhoneEmbedProps {
    onIncomingCall?: (data: any) => void;
    onCallEnd?: (data: any) => void;
    onConnect?: (data: any) => void;
}

// Define the handle interface
export interface ZoomPhoneEmbedHandle {
    dial: (phoneNumber: string) => void;
}

export const ZoomPhoneEmbed = React.forwardRef<ZoomPhoneEmbedHandle, ZoomPhoneEmbedProps>(({
    onIncomingCall,
    onCallEnd,
    onConnect,
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [embedUrl, setEmbedUrl] = useState("");

    // We need a reference to the iframe to send postMessages
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Expose the 'dial' method to the parent
    React.useImperativeHandle(ref, () => ({
        dial: (phoneNumber: string) => {
            if (!iframeRef.current || !iframeRef.current.contentWindow) {
                console.warn("Zoom Embed iframe not ready");
                return;
            }

            // 1. Open and maximize the widget
            setIsOpen(true);
            setIsMinimized(false);

            // 2. Send the 'zp-make-call' event to the iframe
            // Format: { type: 'zp-make-call', data: { number: "1234567890" } }
            const payload = {
                type: 'zp-make-call',
                data: { number: phoneNumber }
            };

            iframeRef.current.contentWindow.postMessage(payload, '*'); // You can restrict targetOrigin if needed
        }
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
        // Construct the URL with the current origin to pass security checks
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
                    break;
                case "zp-call-connected-event":
                    if (onConnect) onConnect(data);
                    break;
                case "zp-call-ended-event":
                    if (onCallEnd) onCallEnd(data);
                    break;
                case "zp-init-success-event":
                    setIframeLoaded(true);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
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
                {/* Header ... */}
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
                            onClick={() => setIsOpen(false)}
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
                            allow="microphone; camera; clipboard-write; autoplay"
                            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
                            onLoad={() => setIframeLoaded(true)}
                            onError={() => setLoadError(true)}
                        />
                    )}

                    {loadError && (
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

// Add display name for debugging
ZoomPhoneEmbed.displayName = "ZoomPhoneEmbed";
