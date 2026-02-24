"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { createClient } from "@supabase/supabase-js";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Phone, Calendar, Clock, User, Mic, Link as LinkIcon, RefreshCw, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CallLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("call_history")
            .select("*")
            .order("call_started_at", { ascending: false })
            .limit(200);

        if (!error) setLogs(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/zoom-call-logs");
            const data = await res.json();
            if (data.success) {
                alert(`Successfully synced ${data.synced_to_db} calls from Zoom!`);
                fetchLogs();
            } else {
                alert("Sync failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Sync error. Check console.");
        }
        setSyncing(false);
    };

    const filteredLogs = logs.filter(log =>
        (log.phone || "").includes(search) ||
        (log.assigned_to || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.notes || "").toLowerCase().includes(search.toLowerCase())
    );

    const formatDuration = (sec: number) => {
        if (!sec) return "00:00";
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            Global <span className="text-blue-600">Call History</span>
                        </h1>
                        <p className="text-gray-500 mt-2">Monitor all internal and external Zoom activities in real-time.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search phone, notes, or user..."
                                className="pl-10 w-64 border-gray-200 focus:ring-blue-500 rounded-xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleSync}
                            disabled={syncing}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-lg shadow-blue-200 transition-all font-semibold flex items-center gap-2"
                        >
                            {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Sync Zoom
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                        <TableHead className="py-5 px-6 font-bold text-gray-600">Timestamp</TableHead>
                                        <TableHead className="font-bold text-gray-600">User</TableHead>
                                        <TableHead className="font-bold text-gray-600">Identifier</TableHead>
                                        <TableHead className="font-bold text-gray-600">Duration</TableHead>
                                        <TableHead className="font-bold text-gray-600">Recording</TableHead>
                                        <TableHead className="font-bold text-gray-600">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i} className="animate-pulse border-b border-gray-50">
                                                <TableCell colSpan={6} className="h-16 bg-gray-50/20"></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center text-gray-400 italic">
                                                No call logs found. Use the sync button to fetch data from Zoom.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLogs.map((log) => (
                                        <TableRow key={log.id} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 uppercase text-xs tracking-wider">
                                                        {log.call_started_at ? new Date(log.call_started_at).toLocaleDateString() : log.followup_date}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-mono">
                                                        <Clock className="h-3 w-3" />
                                                        {log.call_started_at ? new Date(log.call_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                        {log.assigned_to?.[0] || 'U'}
                                                    </div>
                                                    <span className="font-semibold text-gray-700">{log.assigned_to || "Unknown"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-mono text-sm">{log.phone || "No Phone"}</span>
                                                    {log.lead_id && (
                                                        <Badge variant="secondary" className="w-fit mt-1 text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-1.5 py-0">
                                                            Lead: {log.lead_id}
                                                        </Badge>
                                                    )}
                                                    {!log.lead_id && (
                                                        <Badge variant="outline" className="w-fit mt-1 text-[10px] text-gray-400 border-gray-200 px-1.5 py-0">
                                                            Unlinked
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-mono text-sm font-bold ${log.call_duration_seconds > 60 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {formatDuration(log.call_duration_seconds)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {log.recording_url ? (
                                                    <a
                                                        href={log.recording_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold"
                                                    >
                                                        <LinkIcon className="h-3 w-3" />
                                                        Open Recording
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300 text-xs italic font-medium">No recording</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-gray-500 max-w-xs truncate" title={log.notes}>
                                                    {log.notes || "—"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
        audio::-webkit-media-controls-enclosure {
          background-color: transparent !important;
        }
        audio::-webkit-media-controls-panel {
          padding: 0;
        }
      `}</style>
        </DashboardLayout>
    );
}
