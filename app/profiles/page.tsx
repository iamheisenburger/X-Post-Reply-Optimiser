"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ProfilesPage() {
  const [username, setUsername] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all saved profiles
  const profiles = useQuery(api.creators.list);
  const removeProfile = useMutation(api.creators.remove);

  const analyzeProfile = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const cleanUsername = username.replace("@", "").trim();
      
      const response = await fetch("/api/analyze-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze profile");
      }

      setSuccess(`✅ Profile analyzed and saved for @${cleanUsername}`);
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze profile");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (profileId: Id<"creators">) => {
    if (confirm("Delete this profile?")) {
      await removeProfile({ id: profileId });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Creator Profiles</h1>

        {/* Add Profile Section */}
        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Creator</h2>
          <div className="flex gap-3">
            <Input
              placeholder="@username or https://x.com/username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeProfile()}
              className="flex-1 bg-zinc-800 border-zinc-700"
              disabled={isAnalyzing}
            />
            <Button 
              onClick={analyzeProfile} 
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Profile"}
            </Button>
          </div>
          
          {error && (
            <div className="mt-3 text-red-400 text-sm">❌ {error}</div>
          )}
          {success && (
            <div className="mt-3 text-green-400 text-sm">{success}</div>
          )}
        </Card>

        {/* Profile List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Saved Profiles ({profiles?.length || 0})
          </h2>

          {!profiles || profiles.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800 p-8 text-center text-zinc-400">
              No profiles yet. Add your first creator above!
            </Card>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <Card
                  key={profile._id}
                  className="bg-zinc-900 border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          @{profile.username}
                        </h3>
                        <span className="text-sm text-zinc-400">
                          {profile.displayName}
                        </span>
                        {profile.verified && (
                          <span className="text-blue-400 text-sm">✓</span>
                        )}
                      </div>

                      <div className="flex gap-2 mb-2">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded">
                          {profile.primaryNiche}
                        </span>
                        {profile.secondaryNiches?.map((niche) => (
                          <span
                            key={niche}
                            className="inline-block px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded"
                          >
                            {niche}
                          </span>
                        ))}
                      </div>

                      <div className="text-sm text-zinc-400 space-y-1">
                        <div>
                          SaaS Relevance: 
                          <span className="ml-2">
                            {"█".repeat(profile.saasRelevance || 0)}
                            {"░".repeat(5 - (profile.saasRelevance || 0))}
                          </span>
                          <span className="ml-2">{profile.saasRelevance}/5</span>
                        </div>
                        <div>
                          MMA Relevance: 
                          <span className="ml-2">
                            {"█".repeat(profile.mmaRelevance || 0)}
                            {"░".repeat(5 - (profile.mmaRelevance || 0))}
                          </span>
                          <span className="ml-2">{profile.mmaRelevance}/5</span>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-500 mt-2">
                        Optimal Mode: {profile.optimalMode} • 
                        {profile.followerCount?.toLocaleString()} followers •
                        Updated {new Date(profile.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(profile._id)}
                      className="ml-4"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

