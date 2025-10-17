import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-4xl font-bold text-green-700 mb-4">🌍 GeoGuardian</h1>
      <p className="text-gray-600 mb-8">Environmental Change Detection & Alert System</p>
      <div className="space-x-4">
        <Link to="/login" className="px-4 py-2 bg-green-600 text-white rounded">Login</Link>
        <Link to="/register" className="px-4 py-2 border border-green-600 text-green-600 rounded">Register</Link>
      </div>
    </div>
  );
}
