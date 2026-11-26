"use client";

import { useEffect, useState } from "react";
import { GitBranch, Plus, RefreshCw } from "lucide-react";

import {
  createAdminRule,
  createAdminRuleVersion,
  getAdminRules,
  updateAdminRule,
} from "@/services/admin.service";
import { getErrorMessage } from "@/lib/errors";
import type { RuleDefinition, RuleType } from "@/types/rule";
import type { IssueSeverity } from "@/types/evaluation";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

export default function AdminRulesPage() {
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Create Rule Form
  const [ruleKey, setRuleKey] = useState("");
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("generic");
  const [category, setCategory] = useState("reliability");
  const [severity, setSeverity] = useState<IssueSeverity>("warning");
  const [isPracticeAvailable, setIsPracticeAvailable] = useState(true);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadRules = () => {
    setLoading(true);
    getAdminRules()
      .then(setRules)
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load rule definitions."))
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreating(true);

    try {
      const created = await createAdminRule({
        rule_key: ruleKey.trim().toUpperCase().replace(/\s+/g, "_"),
        name: name.trim(),
        rule_type: ruleType,
        category: category.trim() || "reliability",
        severity,
        is_mandatory: false,
        is_active: true,
        is_practice_available: ruleType === "generic" ? isPracticeAvailable : false,
        description: description.trim(),
        config: {},
      });

      setRules((prev) => [created, ...prev]);
      setRuleKey("");
      setName("");
      setDescription("");
      setNotice(`Created rule "${created.name}" (${created.rule_key}).`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create rule."));
    } finally {
      setCreating(false);
    }
  };

  const handlePublishRuleVersion = async (rule: RuleDefinition) => {
    setError("");
    setNotice("");
    try {
      const updated = await createAdminRuleVersion(rule.id, {
        name: rule.name,
        severity: rule.severity,
        category: rule.category,
        description: rule.description,
        config: rule.current_config ?? {},
        changelog: "Published updated rule version from admin console.",
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, ...updated } : r))
      );
      setNotice(`Published new version for rule ${rule.rule_key}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to publish rule version."));
    }
  };

  const handleToggleActive = async (rule: RuleDefinition) => {
    setError("");
    setNotice("");
    try {
      const updated = await updateAdminRule(rule.id, {
        is_active: !rule.is_active,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, ...updated } : r))
      );
      setNotice(
        `${updated.is_active ? "Activated" : "Deactivated"} rule ${rule.rule_key}.`
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to toggle rule status."));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
            [ADMIN // DETERMINISTIC_RULE_ENGINE_REGISTRY]
          </p>
          <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
            Manage Evaluation Rules
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Configure architecture validation rules, practice availability, and
            immutable rule versions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRules}
          className="inline-flex items-center gap-2 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 hover:border-cyan-400/50"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} className="mt-6" />}
      {notice && (
        <div className="mt-6 rounded-[2px] border border-emerald-500/40 bg-emerald-950/25 px-4 py-3 font-mono text-xs text-emerald-300">
          [OK] {notice}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Create Rule Form */}
        <form
          onSubmit={handleCreateRule}
          className="space-y-4 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6 lg:col-span-5"
        >
          <div className="flex items-center gap-2 border-b border-[#1e222b] pb-3">
            <Plus size={16} className="text-amber-400" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
              [REGISTER_RULE_DEFINITION]
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
                Rule Key
              </label>
              <input
                type="text"
                required
                value={ruleKey}
                onChange={(e) => setRuleKey(e.target.value)}
                placeholder="NO_SPOF_DB"
                className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
              >
                <option value="critical">critical</option>
                <option value="error">error</option>
                <option value="warning">warning</option>
                <option value="info">info</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avoid Single Database Node"
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
                Rule Type
              </label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as RuleType)}
                className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
              >
                <option value="generic">generic</option>
                <option value="challenge_specific">challenge_specific</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
              >
                <option value="structure">structure</option>
                <option value="connection">connection</option>
                <option value="performance">performance</option>
                <option value="reliability">reliability</option>
                <option value="requirement">requirement</option>
                <option value="security">security</option>
                <option value="data_integrity">data_integrity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explains what the rule checks and recommended remediation."
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          {ruleType === "generic" && (
            <label className="flex items-center gap-2 font-mono text-xs text-gray-300">
              <input
                type="checkbox"
                checked={isPracticeAvailable}
                onChange={(e) => setIsPracticeAvailable(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>AVAILABLE_IN_PRACTICE_SANDBOXES</span>
            </label>
          )}

          <button
            type="submit"
            disabled={creating}
            className="btn-spectrum flex w-full items-center justify-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider disabled:opacity-60"
          >
            {creating && <Spinner size={14} />}
            <span>{creating ? "REGISTERING..." : "CREATE_RULE"}</span>
          </button>
        </form>

        {/* Rules List */}
        <div className="space-y-3 lg:col-span-7">
          {loading ? (
            <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
              <Spinner /> LOADING_RULES...
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-8 text-center font-mono text-xs text-gray-500">
              No rules registered yet.
            </div>
          ) : (
            rules.map((rule) => {
              const ver = rule.current_version_number ?? 1;

              return (
                <div
                  key={rule.id}
                  className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
                      <span className="rounded-[2px] border border-cyan-500/40 bg-cyan-950/30 px-2 py-0.5 text-cyan-300">
                        {rule.rule_key}
                      </span>
                      <span className="rounded-[2px] border border-[#2e3442] bg-[#14171f] px-2 py-0.5 text-gray-300">
                        v{ver} • {rule.severity}
                      </span>
                      {rule.is_mandatory && (
                        <span className="rounded-[2px] border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-amber-300">
                          MANDATORY
                        </span>
                      )}
                      <span
                        className={`rounded-[2px] border px-2 py-0.5 ${
                          rule.is_active
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                            : "border-gray-700 bg-gray-900 text-gray-500"
                        }`}
                      >
                        {rule.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublishRuleVersion(rule)}
                        className="inline-flex items-center gap-1 rounded-[2px] border border-cyan-500/40 bg-cyan-950/25 px-2.5 py-1 font-mono text-[10px] uppercase text-cyan-300 hover:bg-cyan-950/45"
                      >
                        <GitBranch size={12} />
                        <span>New Version</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(rule)}
                        className="rounded-[2px] border border-[#2e3442] bg-[#090a0d] px-2.5 py-1 font-mono text-[10px] uppercase text-gray-300 hover:border-gray-500"
                      >
                        {rule.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-sm font-semibold text-white">
                    {rule.name}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    {rule.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}