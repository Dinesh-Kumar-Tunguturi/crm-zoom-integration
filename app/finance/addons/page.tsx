'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';


interface AddonRecord {
  id: string;
  lead_id: string;
  lead_name: string;
  email: string;
  company_application_email: string;
  phone_number: string;
  sale_value: number;
  application_sale_value: number | null;
  closed_at: string;
  onboarded_date: string | null;
  badge_value: number | null;
  job_board_value: number | null;
  resume_sale_value: number | null;
  portfolio_sale_value: number | null;
  linkedin_sale_value: number | null;
  github_sale_value: number | null;
  courses_sale_value: number | null;
  custom_sale_value: number | null;
  digital_resume_sale_value: number | null;
}


type AddonType =
  | 'resume'
  | 'portfolio'
  | 'linkedin'
  | 'github'
  | 'courses'
  | 'custom'
  | 'badge'
  | 'job_board'
  | 'digital_resume';


const ADDON_CONFIG: Record<AddonType, { label: string; column: string }> = {
  resume: { label: 'Resume', column: 'resume_sale_value' },
  portfolio: { label: 'Portfolio', column: 'portfolio_sale_value' },
  linkedin: { label: 'LinkedIn', column: 'linkedin_sale_value' },
  github: { label: 'GitHub', column: 'github_sale_value' },
  courses: { label: 'Courses', column: 'courses_sale_value' },
  custom: { label: 'Custom', column: 'custom_sale_value' },
  badge: { label: 'Badge', column: 'badge_value' },
  job_board: { label: 'Job Board', column: 'job_board_value' },
  digital_resume: { label: 'Digital Resume', column: 'digital_resume_sale_value' },
};


const PAGE_SIZES = [30, 50, 100, 200, 500, 1000, 2000];


export default function AddonsPage() {
  const [selectedAddon, setSelectedAddon] = useState<AddonType>('badge');
  const [records, setRecords] = useState<AddonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);


  const fetchAddonRecords = async (searchTerm?: string) => {
    setLoading(true);
    try {
      let url = `/api/addons?type=${selectedAddon}&page=${page}&pageSize=${pageSize}`;
      if (searchTerm && searchTerm.trim() !== '') {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }
     
      const response = await fetch(url);
      const data = await response.json();
      setRecords(data.records || []);
      setTotalRecords(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching addon records:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };


  useEffect(() => {
    fetchAddonRecords();
  }, [selectedAddon, page, pageSize]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setPage(1); // Reset to first page when searching
    fetchAddonRecords(searchQuery);
  };


  const handleClearSearch = () => {
    setSearchQuery('');
    if (isSearching) {
      setIsSearching(false);
      setPage(1);
      fetchAddonRecords();
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };


  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      let url = `/api/addons/download?type=${selectedAddon}`;
      if (searchQuery && searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
     
      const response = await fetch(url);
      const blob = await response.blob();
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = `${ADDON_CONFIG[selectedAddon].label}_Addons_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlObject);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setDownloading(false);
    }
  };


  const getAddonValue = (record: AddonRecord) => {
    switch (selectedAddon) {
      case 'badge': return record.badge_value;
      case 'job_board': return record.job_board_value;
      case 'resume': return record.resume_sale_value;
      case 'portfolio': return record.portfolio_sale_value;
      case 'linkedin': return record.linkedin_sale_value;
      case 'github': return record.github_sale_value;
      case 'courses': return record.courses_sale_value;
      case 'custom': return record.custom_sale_value;
      case 'digital_resume': return record.digital_resume_sale_value;
      default: return null;
    }
  };


  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };


  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };


  return (
    <DashboardLayout>
      <div className="container p-6 max-w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Addons Management</h1>
            <p className="text-muted-foreground">
              View and manage all addon purchases
            </p>
          </div>
        </div>


        {/* Addon Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Addon Type</CardTitle>
            <CardDescription>
              Click on an addon to view related records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by lead ID, name, email, company email, or phone..."
                  className="pl-10 w-[25vw]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
               
              </div>
             
</div>
&nbsp;&nbsp;&nbsp;&nbsp;
<div className="flex flex-wrap gap-2">
  {Object.entries(ADDON_CONFIG).map(([key, { label }]) => {
    // Define different colors for each addon type with glow effect
    const getButtonColor = (addonKey: string) => {
      const isSelected = selectedAddon === addonKey;
     
      switch (addonKey) {
        case 'resume':
          return isSelected
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50 ring-2 ring-blue-400 ring-offset-2'
            : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300';
        case 'portfolio':
          return isSelected
            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/50 ring-2 ring-purple-400 ring-offset-2'
            : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300';
        case 'linkedin':
          return isSelected
            ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/50 ring-2 ring-sky-400 ring-offset-2'
            : 'bg-sky-100 hover:bg-sky-200 text-sky-800 border-sky-300';
        case 'github':
          return isSelected
            ? 'bg-gray-800 hover:bg-gray-900 text-white shadow-lg shadow-gray-700/50 ring-2 ring-gray-600 ring-offset-2'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300';
        case 'courses':
          return isSelected
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400 ring-offset-2'
            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300';
        case 'custom':
          return isSelected
            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/50 ring-2 ring-amber-400 ring-offset-2'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300';
        case 'badge':
          return isSelected
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/50 ring-2 ring-rose-400 ring-offset-2'
            : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300';
        case 'job_board':
          return isSelected
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-400 ring-offset-2'
            : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300';
        case 'digital_resume':
          return isSelected
            ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/50 ring-2 ring-teal-400 ring-offset-2'
            : 'bg-teal-100 hover:bg-teal-200 text-teal-800 border-teal-300';
        default:
          return isSelected
            ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-500/50 ring-2 ring-gray-400 ring-offset-2'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300';
      }
    };


    return (
      <Button
        key={key}
        className={`font-medium transition-all duration-200 ${getButtonColor(key)}`}
        onClick={() => {
          setSelectedAddon(key as AddonType);
          setPage(1);
          setSearchQuery('');
        }}
      >
        {label}
      </Button>
    );
  })}
</div>
            </div>
          </CardContent>
        </Card>


        {/* Search Bar */}
        {/*
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Records</CardTitle>
            <CardDescription>
              Search by Lead ID, Name, Email, Company Email, or Phone Number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by lead ID, name, email, company email, or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
              {(searchQuery || isSearching) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  disabled={isSearching}
                >
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card> */}


        {/* Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm font-medium">records</span>
            </div>


            <Badge variant="secondary" className='text-green-600 font-bold text-sm'>
              Total Records: {totalRecords}
            </Badge>


            <Badge variant="outline"  className='text-red-600 font-bold text-sm'>
              Addon: {ADDON_CONFIG[selectedAddon].label}
            </Badge>


            {searchQuery && (
              <Badge variant="secondary" className="max-w-xs truncate">
                Search: {searchQuery}
              </Badge>
            )}
          </div>


  <Button
          onClick={handleDownloadCSV}
          disabled={downloading || records.length === 0}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download CSV
        </Button>
         
        </div>


        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading records...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No records found for "${searchQuery}" in ${ADDON_CONFIG[selectedAddon].label} addon`
                    : `No records found for ${ADDON_CONFIG[selectedAddon].label} addon`
                  }
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleClearSearch}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Lead ID</TableHead>
                        <TableHead>Lead Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Sale Value</TableHead>
                        <TableHead>App Sale Value</TableHead>
                        <TableHead>
                          {ADDON_CONFIG[selectedAddon].label} Value
                        </TableHead>
                        <TableHead>Closed At</TableHead>
                        <TableHead>Onboarded Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record, index) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {(page - 1) * pageSize + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.lead_id}
                          </TableCell>
                          <TableCell
                            className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                            onClick={() => window.open(`/leads/${record.lead_id}`, "_blank")}
                          >
                            {record.lead_name}
                          </TableCell>
                          <TableCell>{record.email}</TableCell>
                          <TableCell>{record.company_application_email || '-'}</TableCell>
                          <TableCell>{record.phone_number || '-'}</TableCell>
                          <TableCell>{formatCurrency(record.sale_value)}</TableCell>
                          <TableCell>
                            {formatCurrency(record.application_sale_value)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(getAddonValue(record))}
                          </TableCell>
                          <TableCell>{formatDate(record.closed_at)}</TableCell>
                          <TableCell>{formatDate(record.onboarded_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>


                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                       
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

