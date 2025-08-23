import {
  ArrowBigLeftDashIcon,
  ArrowBigLeftIcon,
  ArrowBigRightDashIcon,
  ArrowBigRightIcon,
} from "lucide-react";

const PaginationComponent = ({ currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="flex mt-4 justify-center space-x-2 items-center">
      <button
        className={`px-3 py-2 rounded-lg border border-blue-500 transition-all duration-300 shadow-md
          ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-white text-blue-500 hover:bg-blue-100"
          }
        `}
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(1)}
      >
        <ArrowBigLeftDashIcon />
      </button>
      <button
        className={`px-2 py-2 rounded-lg border border-blue-500 transition-all duration-300 shadow-md
          ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-white text-blue-500 hover:bg-blue-100"
          }
        `}
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((prev) => prev - 1)}
      >
        <ArrowBigLeftIcon />
      </button>

      <span className="text-lg font-semibold text-white bg-blue-400 px-4 py-2 rounded-lg shadow">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={`px-2 py-2 rounded-lg border border-blue-500 transition-all duration-300 shadow-md
          ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-white text-blue-500 hover:bg-blue-100"
          }
        `}
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((prev) => prev + 1)}
      >
        <ArrowBigRightIcon />
      </button>

      <button
        className={`px-3 py-2 rounded-lg border border-blue-500 transition-all duration-300 shadow-md
          ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-white text-blue-500 hover:bg-blue-100"
          }
        `}
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(totalPages)}
      >
        <ArrowBigRightDashIcon />
      </button>
    </div>
  );
};

export default PaginationComponent;
