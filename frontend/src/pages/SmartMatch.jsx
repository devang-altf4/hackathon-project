import React, { useState } from 'react';
import api from '../api/api';
import { Search, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const SmartMatch = () => {
    const [preferences, setPreferences] = useState({
        category: 'plastic',
        minQuantity: '',
        maxPrice: '',
        location: ''
    });
    const [matches, setMatches] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setPreferences({ ...preferences, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // In a real scenario, this would post to a specific matching algorithm endpoint
            // For now, we'll query listings with filters
            const params = new URLSearchParams(preferences).toString();
            // Mocking a match endpoint or using listings search
            const res = await api.get('/listings'); 
            // Simple client-side filtering for demo if backend doesn't support advanced matching yet
            const filtered = res.data.filter(item => 
                (item.category === preferences.category) &&
                (!preferences.minQuantity || item.quantity >= preferences.minQuantity) &&
                (!preferences.maxPrice || item.price <= preferences.maxPrice)
            );
            setMatches(filtered);
        } catch (error) {
            console.error("Match failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Smart Matcher</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search Form */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-fit">
                    <h2 className="text-xl font-semibold mb-4">Find Your Material</h2>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Material Category</label>
                            <select 
                                name="category" 
                                value={preferences.category}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            >
                                {['plastic', 'metal', 'paper', 'electronic', 'organic', 'textile', 'glass', 'other'].map(c => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                            <input 
                                type="number" 
                                name="minQuantity"
                                value={preferences.minQuantity}
                                onChange={handleChange}
                                placeholder="e.g. 100"
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                            <input 
                                type="number" 
                                name="maxPrice"
                                value={preferences.maxPrice}
                                onChange={handleChange}
                                placeholder="e.g. 5000"
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Analyzing...' : <><Search size={18} /> Find Matches</>}
                        </button>
                    </form>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-2">
                    {matches === null ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Ready to Match</h3>
                            <p className="text-gray-500">Enter your requirements API to find the best waste stream matches.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Found {matches.length} Matches
                            </h3>
                            {matches.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm">
                                    No matches found for these criteria. Try adjusting your filters.
                                </div>
                            ) : (
                                matches.map(match => (
                                    <div key={match._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div className="flex gap-4">
                                            {match.images?.[0] && (
                                                <img src={match.images[0]} alt="" className="w-20 h-20 object-cover rounded-md" />
                                            )}
                                            <div>
                                                <h4 className="font-bold text-gray-900">{match.title}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-1">{match.description}</p>
                                                <div className="flex gap-3 mt-2 text-sm">
                                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                                        {match.quantity} {match.unit}
                                                    </span>
                                                    <span className="font-semibold text-gray-700">₹{match.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link 
                                            to={`/tracker/${match._id}`}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                        >
                                            <ArrowRight size={20} />
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartMatch;
