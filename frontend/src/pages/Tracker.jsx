import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import { CheckCircle, Truck, RefreshCw, Box, ArrowDown, ExternalLink } from 'lucide-react';

const Tracker = () => {
    const { id } = useParams();
    const [provenance, setProvenance] = useState([]);
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [provRes, listRes] = await Promise.all([
                    api.get(`/provenance/${id}`),
                    api.get(`/listings/${id}`) // Assuming a public endpoint for single listing exists or needs creation
                ]);
                setProvenance(provRes.data);
                setListing(listRes.data);
            } catch (error) {
                console.error("Failed to load tracking data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getIcon = (action) => {
        switch (action) {
            case 'CREATED': return <Box className="w-6 h-6 text-blue-500" />;
            case 'COLLECTED': return <Truck className="w-6 h-6 text-orange-500" />;
            case 'REMANUFACTURED': return <RefreshCw className="w-6 h-6 text-green-500" />;
            case 'SOLD': return <CheckCircle className="w-6 h-6 text-purple-500" />;
            default: return <Box className="w-6 h-6 text-gray-500" />;
        }
    };

    if (loading) return <div className="p-10 text-center">Loading blockchain records...</div>;

    if (!listing) return <div className="p-10 text-center">Listing not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Provenance Tracker</h1>
                <p className="text-gray-500 mb-6">Immutable history for: <span className="font-semibold text-gray-800">{listing.title}</span></p>
                
                <div className="flex gap-4 mb-8">
                     {listing.images?.[0] && (
                        <img src={listing.images[0]} alt="Waste Item" className="w-32 h-32 object-cover rounded-lg shadow-sm" />
                     )}
                     <div className="flex flex-col justify-center">
                         <div className="text-sm text-gray-500">Current Status</div>
                         <div className="text-xl font-bold text-green-600 uppercase tracking-wide">{listing.status}</div>
                         <div className="text-sm text-gray-400 mt-1">ID: {listing._id}</div>
                     </div>
                </div>

                <div className="relative border-l-4 border-gray-200 ml-4 space-y-12">
                    {provenance.map((record, index) => (
                        <div key={record._id} className="relative pl-12">
                            {/* Timeline Dot */}
                            <div className="absolute -left-3.5 top-1 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                                {getIcon(record.action)}
                            </div>

                            {/* Card content */}
                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">{record.action}</h3>
                                    <span className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">
                                        {new Date(record.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 mb-3">
                                    <span className="font-semibold">Actor:</span> {record.actorId?.name || 'System'} ({record.actorId?.role || 'Admin'})
                                </div>
                                
                                {/* Blockchain Hash Display */}
                                <div className="bg-gray-900 rounded p-3 font-mono text-xs text-green-400 overflow-x-auto">
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <span>PREV:</span>
                                        <span className="truncate">{record.previousHash}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-yellow-400">HASH:</span>
                                        <span className="truncate">{record.hash}</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-right">
                                     <a href={`#`} className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                                         Verify on Ledger <ExternalLink className="w-3 h-3"/>
                                     </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tracker;
