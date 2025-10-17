// src/components/trading/WatchlistPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
  useWatchlists, useWatchlist,
  useCreateWatchlist, useUpdateWatchlist, useDeleteWatchlist,
  useAddToWatchlist, useRemoveFromWatchlist
} from '@/hooks/useWatchList';
import { useAssets } from '@/hooks/useTrading';
import { Plus, X, Trash2, Edit3, Save, Loader, Search } from 'lucide-react';

interface WatchlistPanelProps {
  accountId: string;
  onSymbolSelect: (symbol: string) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ accountId, onSymbolSelect }) => {
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: watchlists, isLoading: watchlistsLoading } = useWatchlists(accountId);
  const safeWatchlists = Array.isArray(watchlists) ? watchlists : [];
  const { data: watchlist, isLoading: watchlistLoading } = useWatchlist(selectedWatchlistId || 0);
  const { data: assetsResponse } = useAssets(accountId, { status: 'active', tradable: true });
  const assets = assetsResponse?.results || [];

  const createWatchlist = useCreateWatchlist(accountId);
  const updateWatchlist = useUpdateWatchlist(selectedWatchlistId || 0);
  const deleteWatchlist = useDeleteWatchlist(selectedWatchlistId || 0);
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  useEffect(() => {
    if (safeWatchlists.length > 0 && !selectedWatchlistId) {
      setSelectedWatchlistId(safeWatchlists[0].id);
      setEditName(safeWatchlists[0].name);
    }
  }, [safeWatchlists, selectedWatchlistId]);

  useEffect(() => {
    if (watchlist) setEditName(watchlist.name);
  }, [watchlist]);

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    try {
      const result = await createWatchlist.mutateAsync({ name: newWatchlistName.trim(), symbols: [] });
      setSelectedWatchlistId(result.id);
      setNewWatchlistName('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateWatchlistName = async () => {
    if (!editName.trim() || !selectedWatchlistId) return;
    try { await updateWatchlist.mutateAsync({ name: editName.trim() }); setIsEditing(false); }
    catch (error) { console.error(error); }
  };

  const handleDeleteWatchlist = async () => {
    if (!selectedWatchlistId) return;
    try { await deleteWatchlist.mutateAsync(); setSelectedWatchlistId(null); setIsEditing(false); }
    catch (error) { console.error(error); }
  };

  const handleAddSymbol = async (symbol: string) => {
    if (!selectedWatchlistId || !symbol) return;
    try { await addToWatchlist.mutateAsync({ watchlistId: selectedWatchlistId, symbol }); setNewSymbol(''); }
    catch (error) { console.error(error); }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (!selectedWatchlistId || !symbol) return;
    try { await removeFromWatchlist.mutateAsync({ watchlistId: selectedWatchlistId, symbol }); }
    catch (error) { console.error(error); }
  };

  const filteredAssets = assets.filter(a => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (watchlistsLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Watchlists</h3>
        <div className="text-center py-8">
          <Loader className="animate-spin mx-auto text-blue-500" size={24} />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading watchlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Watchlists</h3>

      {safeWatchlists.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">No watchlists yet. Create one below.</p>
      )}

      {/* Watchlist Selector */}
      {safeWatchlists.length > 0 && (
        <div className="mb-4 flex space-x-2">
          <select
            value={selectedWatchlistId || ''}
            onChange={(e) => setSelectedWatchlistId(Number(e.target.value))}
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
          >
            {safeWatchlists.map(wl => <option key={wl.id} value={wl.id}>{wl.name}</option>)}
          </select>
          {selectedWatchlistId && (
            <div className="flex space-x-1">
              <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"><Edit3 size={16} /></button>
              <button onClick={handleDeleteWatchlist} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400"><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* Create new watchlist */}
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          value={newWatchlistName}
          onChange={(e) => setNewWatchlistName(e.target.value)}
          placeholder="New watchlist name"
          className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={handleCreateWatchlist}
          disabled={createWatchlist.isPending || !newWatchlistName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {createWatchlist.isPending ? <Loader className="animate-spin" size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Watchlist Details */}
      {selectedWatchlistId && (
        <>
          {isEditing ? (
            <div className="flex space-x-2 mb-4">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <button onClick={handleUpdateWatchlistName} disabled={updateWatchlist.isPending} className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                {updateWatchlist.isPending ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
              </button>
            </div>
          ) : (
            <h4 className="text-md font-semibold mb-4">{watchlist?.name}</h4>
          )}

          {/* Symbols in Watchlist */}
          <div className="mb-4">
            <h5 className="text-sm font-medium mb-2">Symbols in Watchlist</h5>
            {watchlistLoading ? (
              <Loader className="animate-spin mx-auto text-blue-500" size={20} />
            ) : !watchlist?.symbols?.length ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-2">No symbols yet. Add symbols below.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {watchlist.symbols.map(symbol => (
                  <div key={symbol} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <button onClick={() => onSymbolSelect(symbol)} className="flex-1 text-left font-medium">{symbol}</button>
                    <button onClick={() => handleRemoveSymbol(symbol)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Symbol */}
          <div>
            <h5 className="text-sm font-medium mb-2">Search Assets</h5>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbols..."
                className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filteredAssets.slice(0, 10).map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <button onClick={() => onSymbolSelect(asset.symbol)} className="flex-1 text-left">
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</div>
                  </button>
                  <button onClick={() => handleAddSymbol(asset.symbol)} disabled={addToWatchlist.isPending || watchlist?.symbols?.includes(asset.symbol)} className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus size={16} />
                  </button>
                </div>
              ))}
              {filteredAssets.length === 0 && searchQuery && <p className="text-gray-500 dark:text-gray-400 text-center py-2">No assets found</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};












// // src/components/trading/WatchList.tsx
// import React, { useState } from 'react';
// import { 
//   useWatchlists, 
//   useWatchlist,
//   useCreateWatchlist, 
//   useUpdateWatchlist, 
//   useDeleteWatchlist,
//   useAddToWatchlist,
//   useRemoveFromWatchlist
// } from '@/hooks/useWatchList';
// import { useAssets } from '@/hooks/useTrading';
// import { Plus, X, Trash2, Edit3, Save, Loader, Search } from 'lucide-react';

// interface WatchlistPanelProps {
//   accountId: string;
//   onSymbolSelect: (symbol: string) => void;
// }

// export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ accountId, onSymbolSelect }) => {
//   const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
//   const [newSymbol, setNewSymbol] = useState('');
//   const [newWatchlistName, setNewWatchlistName] = useState('');
//   const [isEditing, setIsEditing] = useState(false);
//   const [editName, setEditName] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   const { data: watchlists, isLoading: watchlistsLoading } = useWatchlists(accountId);
//   const { data: watchlist, isLoading: watchlistLoading } = useWatchlist(selectedWatchlistId || 0);
//   const { data: assetsResponse } = useAssets(accountId, { status: 'active', tradable: true });
//   const assets = assetsResponse?.results || [];
  
//   const createWatchlist = useCreateWatchlist(accountId);
//   const updateWatchlist = useUpdateWatchlist(selectedWatchlistId || 0);
//   const deleteWatchlist = useDeleteWatchlist(selectedWatchlistId || 0);
//   const addToWatchlist = useAddToWatchlist();
//   const removeFromWatchlist = useRemoveFromWatchlist();

//   // Set the first watchlist as selected when loaded
//   React.useEffect(() => {
//     if (watchlists && watchlists.length > 0 && !selectedWatchlistId) {
//       setSelectedWatchlistId(watchlists[0].id);
//       setEditName(watchlists[0].name);
//     }
//   }, [watchlists, selectedWatchlistId]);
  
//   // Update edit name when selected watchlist changes
//   React.useEffect(() => {
//     if (watchlist) {
//       setEditName(watchlist.name);
//     }
//   }, [watchlist]);
  
//   const handleCreateWatchlist = async () => {
//     if (!newWatchlistName.trim()) return;
    
//     try {
//       const result = await createWatchlist.mutateAsync({ 
//         name: newWatchlistName.trim(),
//         symbols: []
//       });
//       setSelectedWatchlistId(result.id);
//       setNewWatchlistName('');
//     } catch (error) {
//       console.error('Failed to create watchlist:', error);
//     }
//   };
  
//   const handleUpdateWatchlistName = async () => {
//     if (!editName.trim() || !selectedWatchlistId) return;
    
//     try {
//       await updateWatchlist.mutateAsync({ name: editName.trim() });
//       setIsEditing(false);
//     } catch (error) {
//       console.error('Failed to update watchlist:', error);
//     }
//   };
  
//   const handleDeleteWatchlist = async () => {
//     if (!selectedWatchlistId) return;
    
//     try {
//       await deleteWatchlist.mutateAsync();
//       setSelectedWatchlistId(null);
//       setIsEditing(false);
//     } catch (error) {
//       console.error('Failed to delete watchlist:', error);
//     }
//   };
  
//   const handleAddSymbol = async (symbol: string) => {
//     if (!selectedWatchlistId) return;
    
//     try {
//       await addToWatchlist.mutateAsync({ watchlistId: selectedWatchlistId, symbol }); 
//       setNewSymbol('');
//     } catch (error) {
//       console.error('Failed to add symbol:', error);
//     }
//   };
  
//   const handleRemoveSymbol = async (symbol: string) => {
//     if (!selectedWatchlistId) return;
    
//     try {
//         await removeFromWatchlist.mutateAsync({ watchlistId: selectedWatchlistId, symbol });
//     } catch (error) {
//       console.error('Failed to remove symbol:', error);
//     }
//   };
  
//   const filteredAssets = assets.filter(asset => 
//     asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     asset.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );
  
//   if (watchlistsLoading) {
//     return (
//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Watchlists</h3>
//         </div>
//         <div className="text-center py-8">
//           <Loader className="animate-spin mx-auto text-blue-500" size={24} />
//           <p className="mt-2 text-gray-500 dark:text-gray-400">Loading watchlists...</p>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Watchlists</h3>
//       </div>
      
//       {/* Watchlist selector */}
//       <div className="mb-4">
//         <div className="flex space-x-2 mb-2">
//           <select
//             value={selectedWatchlistId || ''}
//             onChange={(e) => setSelectedWatchlistId(Number(e.target.value))}
//             className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
//           >
//             {watchlists?.map(wl => (
//               <option key={wl.id} value={wl.id}>{wl.name}</option>
//             ))}
//           </select>
          
//           {selectedWatchlistId && (
//             <div className="flex space-x-1">
//               <button
//                 onClick={() => setIsEditing(!isEditing)}
//                 className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//               >
//                 <Edit3 size={16} />
//               </button>
//               <button
//                 onClick={handleDeleteWatchlist}
//                 className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
//               >
//                 <Trash2 size={16} />
//               </button>
//             </div>
//           )}
//         </div>
        
//         {/* Create new watchlist */}
//         <div className="flex space-x-2">
//           <input
//             type="text"
//             value={newWatchlistName}
//             onChange={(e) => setNewWatchlistName(e.target.value)}
//             placeholder="New watchlist name"
//             className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
//           />
//           <button
//             onClick={handleCreateWatchlist}
//             disabled={createWatchlist.isPending || !newWatchlistName.trim()}
//             className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
//           >
//             {createWatchlist.isPending ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
//           </button>
//         </div>
//       </div>
      
//       {selectedWatchlistId && (
//         <>
//           {/* Watchlist name editor */}
//           {isEditing ? (
//             <div className="flex space-x-2 mb-4">
//               <input
//                 type="text"
//                 value={editName}
//                 onChange={(e) => setEditName(e.target.value)}
//                 className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
//               />
//               <button
//                 onClick={handleUpdateWatchlistName}
//                 disabled={updateWatchlist.isPending}
//                 className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
//               >
//                 {updateWatchlist.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
//               </button>
//             </div>
//           ) : (
//             <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">{watchlist?.name}</h4>
//           )}
          
//           {/* Add symbol to watchlist */}
//           <div className="mb-4">
//             <div className="flex space-x-2">
//               <input
//                 type="text"
//                 value={newSymbol}
//                 onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
//                 placeholder="Add symbol"
//                 className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
//               />
//               <button
//                 onClick={() => handleAddSymbol(newSymbol)}
//                 disabled={addToWatchlist.isPending || !newSymbol.trim()}
//                 className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {addToWatchlist.isPending ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
//               </button>
//             </div>
//           </div>
          
//           {/* Watchlist symbols */}
//           <div className="mb-6">
//             <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Symbols in Watchlist</h5>
//             {watchlistLoading ? (
//               <div className="text-center py-4">
//                 <Loader className="animate-spin mx-auto text-blue-500" size={20} />
//               </div>
//             ) : watchlist?.symbols?.length === 0 ? (
//               <p className="text-gray-500 dark:text-gray-400 text-center py-4">No symbols in watchlist</p>
//             ) : (
//               <div className="space-y-2 max-h-40 overflow-y-auto">
//                 {watchlist?.symbols?.map(symbol => (
//                   <div
//                     key={symbol}
//                     className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
//                   >
//                     {/* Add onClick handler here to use onSymbolSelect prop */}
//                     <button
//                       onClick={() => onSymbolSelect(symbol)}
//                       className="flex-1 text-left font-medium text-gray-900 dark:text-white"
//                     >
//                       {symbol}
//                     </button>
//                     <button
//                       onClick={() => handleRemoveSymbol(symbol)}
//                       disabled={removeFromWatchlist.isPending}
//                       className="text-red-500 hover:text-red-700 disabled:opacity-50"
//                     >
//                       <X size={16} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
          
//           {/* Asset search for adding to watchlist */}
//           <div>
//             <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Search Assets</h5>
//             <div className="relative mb-2">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder="Search symbols..."
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
//               />
//             </div>
            
//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {filteredAssets.slice(0, 10).map(asset => (
//                 <div
//                   key={asset.id}
//                   className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
//                 >
//                   <button
//                     onClick={() => onSymbolSelect(asset.symbol)} // Use the onSymbolSelect prop here
//                     className="flex-1 text-left"
//                   >
//                     <div className="font-medium text-gray-900 dark:text-white">{asset.symbol}</div>
//                     <div className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</div>
//                   </button>
//                   <button
//                     onClick={() => handleAddSymbol(asset.symbol)}
//                     disabled={addToWatchlist.isPending || watchlist?.symbols?.includes(asset.symbol)}
//                     className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     <Plus size={16} />
//                   </button>
//                 </div>
//               ))}
              
//               {filteredAssets.length === 0 && searchQuery && (
//                 <p className="text-gray-500 dark:text-gray-400 text-center py-2">No assets found</p>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

