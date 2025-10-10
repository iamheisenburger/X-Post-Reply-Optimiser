"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TargetManager() {
  const targets = useQuery(api.targets.list);
  const createTarget = useMutation(api.targets.create);
  const removeTarget = useMutation(api.targets.remove);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [tags, setTags] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTarget({
      username,
      displayName,
      priority,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setUsername("");
    setDisplayName("");
    setPriority("medium");
    setTags("");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add VIP Target</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="@levelsio"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Pieter Levels"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v: "high" | "medium" | "low") => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="mma, saas, tech"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit">Add Target</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            VIP Target List ({targets?.length || 0}/50)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!targets ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : targets.length === 0 ? (
            <p className="text-muted-foreground">
              No targets yet. Add your first VIP target above!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((target) => (
                  <TableRow key={target._id}>
                    <TableCell className="font-medium">{target.username}</TableCell>
                    <TableCell>{target.displayName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          target.priority === "high"
                            ? "destructive"
                            : target.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {target.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {target.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="mr-1">
                          {tag}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTarget({ id: target._id })}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

