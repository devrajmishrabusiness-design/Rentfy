"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function SignupPage() {
  const [form, setForm] = useState({
    agency_name: "",
    owner_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      alert("User creation failed");
      return;
    }

    const { error: agencyError } = await supabase
      .from("agencies")
      .insert([
        {
          agency_name: form.agency_name,
          owner_name: form.owner_name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          auth_user_id: user.id,
        },
      ]);

    if (agencyError) {
      alert(agencyError.message);
      return;
    }

    alert("Agency created successfully!");
    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Agency Signup
        </h1>

        <input
          placeholder="Agency Name"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) =>
            setForm({ ...form, agency_name: e.target.value })
          }
        />

        <input
          placeholder="Owner Name"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) =>
            setForm({ ...form, owner_name: e.target.value })
          }
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <input
          placeholder="Phone"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          placeholder="City"
          className="w-full border p-3 rounded mb-4"
          onChange={(e) =>
            setForm({ ...form, city: e.target.value })
          }
        />

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          Create Agency Account
        </button>
      </div>
    </main>
  );
}