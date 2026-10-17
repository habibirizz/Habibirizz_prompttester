import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { deleteApi, getApi, postApi, putApi } from "./api";
import { URLS } from "./urls";
import ReactDOM from "react-dom";

interface PickupLine {
  _id: string;
  line: string;
  language: string;
  dialect: string;
  gender: string;
  isGenz: boolean;
  createdVia: string;
  origin: string;
}

interface UserSubmission {
  _id: string;
  line: string;
  language: string;
  dialect: string;
  gender: string;
  isGenz: boolean;
  isReviewed: boolean;
  isApproved?: boolean;
}

interface AdminFilters {
  gender: string;
  language: string;
  // isGenz: string;
  origin: string;
  page: number;
  limit: number;
}

interface UserFilters {
  page: number;
  limit: number;
  isReviewed: string;
}

interface ModalData {
  _id: string;
  line: string;
  language: string;
  dialect: string;
  gender: string;
  isGenz: boolean;
  isReviewed:boolean
}

interface Props {
  setIsLoading: (loading: boolean) => void;
}

const ViewAllPickupLines: React.FC<Props> = ({ setIsLoading }) => {
  const [activeTab, setActiveTab] = useState<"admin" | "user">("admin");
  const [data, setData] = useState<PickupLine[] | UserSubmission[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
const [deleteId, setDeleteId] = useState<string>("");
const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
const [rejectId, setRejectId] = useState<string>("");
  const [adminFilters, setAdminFilters] = useState<AdminFilters>({
    gender: "",
    language: "",
    // isGenz: "",
    origin: "",
    page: 1,
    limit: 20,
  });
  
  const [userFilters, setUserFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    isReviewed: "",
  });

  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [editData, setEditData] = useState<ModalData | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, adminFilters, userFilters]);

  const fetchData = async () => {
     setIsLoading(true);
    try {
      let response;
      const params = new URLSearchParams();

      if (activeTab === "admin") {
        if (adminFilters.gender) params.append("gender", adminFilters.gender);
        if (adminFilters.language) params.append("language", adminFilters.language);
        // if (adminFilters.isGenz !== "") params.append("isGenz", adminFilters.isGenz);
        if (adminFilters.origin) params.append("origin", adminFilters.origin);
        params.append("page", String(adminFilters.page));
        params.append("limit", String(adminFilters.limit));

        response = await getApi(`${URLS.adminPickupLines}?${params}`);
        setData(response.data.data.pickupLines || []);
        setTotalCount(response.data.data.totalPickupLines || 0);
      } else {
        if (userFilters.isReviewed !== "") {
          params.append("isReviewed", userFilters.isReviewed);
        }
        params.append("page", String(userFilters.page));
        params.append("limit", String(userFilters.limit));

        response = await getApi(`${URLS.userPickUpSubmissions}?${params}`);
        setData(response.data.data.submissions || []);
        setTotalCount(response.data.data.totalSubmissions || 0);
      }
    } catch (error: any) {
      toast.error("Failed to load pickup lines");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const source = activeTab === "admin" ? "admin" : "user";
      const params = new URLSearchParams();
      params.append("id", id);
      params.append("source", source);

      const response = await getApi(`${URLS.getSinglePickupLine}?${params}`);
      const pickupLineData = response.data.data.pickupLine || response.data.data;
      
      setModalData(pickupLineData);
      setEditData({ ...pickupLineData });
    } catch (error: any) {
      toast.error("Failed to load pickup line details");
      console.error(error);
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdatePickupLine = async () => {
    if (!editData) return;

    try {
      const payload = {
        line: editData.line,
        language: editData.language,
        dialect: editData.dialect,
        gender: editData.gender,
        isGenz: editData.isGenz,
      };

       if (activeTab === "admin") {
        await putApi(`${URLS.updatePickUpLine}/${editData._id}`, payload);
      } else {
        await putApi(`${URLS.updateUserSubmission}/${editData._id}`, payload);
      }
      toast.success("Pickup line updated successfully");
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update pickup line");
      console.error(error);
    }
  };

  const handleReview = async (id: string, approved: boolean) => {
    try {
      const payload = {
        submissionId: id,
        isAccepted: approved,
      };

      await postApi(URLS.reviewPickUpLine, payload);
      toast.success(`${approved ? "Approved" : "Rejected"} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to review submission");
      console.error(error);
    }
  };



  const clearAdminFilter = (key: keyof AdminFilters) => {
    setAdminFilters(prev => ({ ...prev, [key]: "", page: 1 }));
  };

  const clearUserFilter = (key: keyof UserFilters) => {
    setUserFilters(prev => ({ ...prev, [key]: "", page: 1 }));
  };

  const getActiveFiltersCount = (): number => {
    if (activeTab === "admin") {
      let count = 0;
      if (adminFilters.gender) count++;
      if (adminFilters.language) count++;
      // if (adminFilters.isGenz !== "") count++;
      if (adminFilters.origin) count++;
      return count;
    } else {
      return userFilters.isReviewed !== "" ? 1 : 0;
    }
  };

  const clearAllFilters = () => {
    if (activeTab === "admin") {
      setAdminFilters({
        gender: "",
        language: "",
        // isGenz: "",
        origin: "",
        page: 1,
        limit: adminFilters.limit,
      });
    } else {
      setUserFilters({
        page: 1,
        limit: userFilters.limit,
        isReviewed: "",
      });
    }
  };

  const isPickupLine = (item: PickupLine | UserSubmission): item is PickupLine => {
    return 'origin' in item;
  };

  const isUserSubmission = (item: PickupLine | UserSubmission): item is UserSubmission => {
    return 'isReviewed' in item;
  };

  const handleDelete = async (id: string) => {
  setDeleteId(id);
  setShowDeleteModal(true);
};

const confirmDelete = async () => {
  try {
    await deleteApi(`${URLS.deletePickupLine}/${deleteId}`);
    toast.success("Deleted successfully");
    setShowDeleteModal(false);
    setDeleteId("");
    fetchData();
  } catch (error: any) {
    toast.error("Failed to delete");
    console.error(error);
  }
};

const handleRejectClick = (id: string) => {
  setRejectId(id);
  setShowRejectModal(true);
};

const confirmReject = async () => {
  try {
    const payload = {
      submissionId: rejectId,
      isAccepted: false,
    };

    await postApi(URLS.reviewPickUpLine, payload);
    toast.success("Rejected successfully");
    setShowRejectModal(false);
    setRejectId("");
    fetchData();
  } catch (error: any) {
    toast.error("Failed to reject submission");
    console.error(error);
  }
};

useEffect(() => {
  if (showModal || showDeleteModal || showRejectModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [showModal, showDeleteModal]);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 py-6 relative"  // Added 'relative' here
    >
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-900/60 backdrop-blur-sm p-1.5 border border-gray-700/70 shadow-inner gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("admin")}
            className={`
              px-7 py-3 text-base font-medium rounded-lg transition-all
              ${activeTab === "admin"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:text-white hover:bg-gray-800/60"}
            `}
          >
            All Pickup Lines
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("user")}
            className={`
              px-7 py-3 text-base font-medium rounded-lg transition-all
              ${activeTab === "user"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:text-white hover:bg-gray-800/60"}
            `}
          >
            User Submissions
          </motion.button>
        </div>
      </div>

      {/* Professional Filters Card */}
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl mb-8 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Filter className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              {getActiveFiltersCount() > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} applied
                </p>
              )}
            </div>
          </div>
          
          {getActiveFiltersCount() > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-600/30"
            >
              <X className="w-4 h-4" />
              Clear All
            </motion.button>
          )}
        </div>

        <div className="p-6">
          {activeTab === "admin" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Language */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Language
                </label>
                <div className="relative">
                  <select
                    value={adminFilters.language}
                    onChange={e => setAdminFilters(prev => ({ ...prev, language: e.target.value, page: 1 }))}
                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  >
                    <option value="">All Languages</option>
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </select>
                  {adminFilters.language && (
                    <button
                      onClick={() => clearAdminFilter("language")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-red-600/20 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Gender
                </label>
                <div className="relative">
                  <select
                    value={adminFilters.gender}
                    onChange={e => setAdminFilters(prev => ({ ...prev, gender: e.target.value, page: 1 }))}
                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {adminFilters.gender && (
                    <button
                      onClick={() => clearAdminFilter("gender")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-red-600/20 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Gen Z */}
              {/* <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Gen Z Style
                </label>
                <div className="relative">
                  <select
                    value={adminFilters.isGenz}
                    onChange={e => setAdminFilters(prev => ({ ...prev, isGenz: e.target.value, page: 1 }))}
                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  >
                    <option value="">All Styles</option>
                    <option value="true">Gen Z</option>
                    <option value="false">Regular</option>
                  </select>
                  {adminFilters.isGenz !== "" && (
                    <button
                      onClick={() => clearAdminFilter("isGenz")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-red-600/20 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div> */}

              {/* Origin */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Origin
                </label>
                <div className="relative">
                  <select
                    value={adminFilters.origin}
                    onChange={e => setAdminFilters(prev => ({ ...prev, origin: e.target.value, page: 1 }))}
                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  >
                    <option value="">All Origins</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                  {adminFilters.origin && (
                    <button
                      onClick={() => clearAdminFilter("origin")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-red-600/20 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items per page */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Per Page
                </label>
                <select
                  value={adminFilters.limit}
                  onChange={e => setAdminFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Review Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Review Status
                </label>
                <div className="relative">
                  <select
                    value={userFilters.isReviewed}
                    onChange={e => setUserFilters(prev => ({ ...prev, isReviewed: e.target.value, page: 1 }))}
                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  >
                    <option value="">All Submissions</option>
                    <option value="false">Pending Review</option>
                    <option value="true">Reviewed</option>
                  </select>
                  {userFilters.isReviewed !== "" && (
                    <button
                      onClick={() => clearUserFilter("isReviewed")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-red-600/20 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items per page */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Per Page
                </label>
                <select
                  value={userFilters.limit}
                  onChange={e => setUserFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 overflow-x-auto hide-scrollbar">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {activeTab === "admin" ? "All Pickup Lines" : "User Submissions"}
            <span className="ml-3 text-sm text-gray-400">({totalCount} total)</span>
          </h2>
        </div>

        { data.length === 0 ? (
          <div className="text-center py-24 text-gray-400 text-lg">
            No items found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-900/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Line</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lang</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dialect</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Gen Z</th>
                    {activeTab === "admin" && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Origin</th>
                    )}
                    {activeTab === "user" && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-gray-200 line-clamp-2">{item.line}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 uppercase text-sm">{item.language}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{item.dialect || "—"}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{item.gender}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.isGenz ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {item.isGenz ? "Yes" : "No"}
                        </span>
                      </td>
                      {activeTab === "admin" && isPickupLine(item) && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.origin === "Admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {item.origin}
                          </span>
                        </td>
                      )}
                      {activeTab === "user" && isUserSubmission(item) && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.isReviewed 
                              ? item.isReviewed 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {item.isReviewed ? (item.isReviewed ? "Approved" : "Rejected") : "Pending"}
                          </span>
                        </td>
                      )}
                     <td className="px-6 py-4">
  <div className="flex flex-wrap gap-2">
    {activeTab === "admin" ? (
      <>
      <div className="w-full gap-2 flex flex-col">
        <button
          onClick={() => handleViewDetails(item._id)}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(item._id)}
          className="px-3 py-1.5 bg-red-800/80 hover:bg-red-900 rounded text-sm font-medium transition-colors"
        >
          Delete
        </button>
        </div>
      </>
    ) : (
      <>
        {isUserSubmission(item) && !item.isReviewed ? (
          <>
            <button
              onClick={() => handleViewDetails(item._id)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors flex items-center gap-1 w-full justify-center"
            >
              <Eye className="w-4 h-4" />
             {item.isReviewed ? "View" : "Edit"}
            </button>
            <div className="flex gap-2 w-full justify-between align-center">
            <button
              onClick={() => handleReview(item._id, true)}
              className="px-6 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors flex-1 flex justify-center"
            >
              <Check/>
            </button>
           <button
  onClick={() => handleRejectClick(item._id)}
  className="px-6 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors flex-1 flex justify-center"
>
  <X/>
</button>
</div>
          </>
        ) : (
          <button
            onClick={() => handleViewDetails(item._id)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors flex items-center gap-1 flex-1 justify-center"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        )}
      </>
    )}
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-700 flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-400">
                Showing page {activeTab === "admin" ? adminFilters.page : userFilters.page} of{" "}
                {Math.ceil(totalCount / (activeTab === "admin" ? adminFilters.limit : userFilters.limit))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (activeTab === "admin") {
                      setAdminFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }));
                    } else {
                      setUserFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }));
                    }
                  }}
                  disabled={activeTab === "admin" ? adminFilters.page <= 1 : userFilters.page <= 1}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Previous
                </button>

                <button
                  onClick={() => {
                    if (activeTab === "admin") {
                      setAdminFilters(p => ({ ...p, page: p.page + 1 }));
                    } else {
                      setUserFilters(p => ({ ...p, page: p.page + 1 }));
                    }
                  }}
                  disabled={
                    activeTab === "admin"
                      ? adminFilters.page >= Math.ceil(totalCount / adminFilters.limit)
                      : userFilters.page >= Math.ceil(totalCount / userFilters.limit)
                  }
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
{/* Edit Modal */}
     
    </motion.div>
{showModal && ReactDOM.createPortal(
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* All your modal content stays exactly the same */}
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-6 py-4 border-b border-gray-700 flex items-center justify-between ">
          <h3 className="text-xl font-semibold text-white">
         {activeTab === "admin"
    ? "Edit Pickup Line"
    : modalData?.isReviewed
      ? "View Reviewed Submission"
      : "Edit Pending Submission"}
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {modalLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : editData ? (
            <div className="space-y-5">
              {/* All your form fields stay exactly the same */}
              {/* Pickup Line */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pickup Line
                </label>
              <textarea
  value={editData.line}
  onChange={(e) => setEditData({ ...editData, line: e.target.value })}
  rows={3}
  disabled={activeTab === "user" && modalData?.isReviewed === true}
  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
  placeholder="Enter pickup line..."
/>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={editData.language}
                    disabled={activeTab === "user" && modalData?.isReviewed === true}
                  onChange={(e) => setEditData({ ...editData, language: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                >
                  <option value="ar">Arabic</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Dialect */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dialect
                </label>
                <input
                  type="text"
                  value={editData.dialect}
                    disabled={activeTab === "user" && modalData?.isReviewed === true}

                  onChange={(e) => setEditData({ ...editData, dialect: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="Enter dialect (e.g., EGYPTIAN, PALESTINIAN)"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  value={editData.gender}
                    disabled={activeTab === "user" && modalData?.isReviewed === true}

                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Gen Z Style */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gen Z Style
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editData.isGenz === true}
                      onChange={() => setEditData({ ...editData, isGenz: true })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editData.isGenz === false}
                      onChange={() => setEditData({ ...editData, isGenz: false })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Failed to load data
            </div>
          )}
        </div>

        {/* Modal Footer */}
      {editData && (
  <div className="bg-gray-800/95 backdrop-blur-sm px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
    <button
      onClick={() => setShowModal(false)}
      className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
    >
      {activeTab === "admin" || !modalData?.isReviewed ? "Cancel" : "Close"}
    </button>

    {(activeTab === "admin" || !modalData?.isReviewed) && (
      <button
        onClick={handleUpdatePickupLine}
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg"
      >
        Save Changes
      </button>
    )}
  </div>
)}
      </motion.div>
    </motion.div>
  </AnimatePresence>,
  document.body
)}

{showDeleteModal && ReactDOM.createPortal(
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setShowDeleteModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
         <div className="bg-gradient-to-r from-red-600/10 to-red-800/10 px-6 py-4 border-b border-gray-700 flex items-center justify-between rounded-2xl">
          <h3 className="text-xl font-semibold text-white">
            Confirm Delete
          </h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-gray-300 text-center">
            Are you sure you want to delete this pickup line? This action cannot be undone.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-800/95 backdrop-blur-sm px-6 py-4 flex justify-center gap-3 rounded-2xl">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>,
  document.body
)}

{showRejectModal && ReactDOM.createPortal(
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setShowRejectModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600/10 to-red-800/10 px-6 py-4 border-b border-gray-700 flex items-center justify-between rounded-2xl">
          <h3 className="text-xl font-semibold text-white">
            Confirm Reject
          </h3>
          <button
            onClick={() => setShowRejectModal(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-gray-300 text-center">
            Are you sure you want to reject this pickup line submission? This action cannot be undone.
          </p>
        </div>

        {/* Modal Footer */}
      <div className="bg-gray-800/95 backdrop-blur-sm px-6 py-4 flex justify-center gap-3 rounded-2xl">
          <button
            onClick={() => setShowRejectModal(false)}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmReject}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            Reject
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>,
  document.body
)}
    </>
  );
};

export default ViewAllPickupLines;