import React from 'react';
import { Users, X, RadioTower } from 'lucide-react';
import { DEVICE_SPECS, TEAM_IDENTITY } from '../data/devices';
import { DeviceId } from '../types/twin';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDevice: (id: DeviceId) => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  open,
  onClose,
  onSelectDevice,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-[#0F141F] border border-slate-700/70 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F18]">
          <div className="flex items-center gap-2.5">
            <RadioTower className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                {TEAM_IDENTITY.projectTitle}
              </h2>
              <p className="text-xs text-slate-400">{TEAM_IDENTITY.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto studio-scroll">
          {/* Team Identity Block */}
          <div className="p-4 rounded-lg bg-[#141B29] border border-cyan-500/35">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Users className="w-4 h-4" />
              <span>Identitas Tim Pengembang — {TEAM_IDENTITY.groupName}</span>
            </div>
            <ol className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TEAM_IDENTITY.members.map((member, index) => (
                <li
                  key={member}
                  className="px-3 py-2.5 rounded-md bg-[#0B0F18] border border-slate-800 text-xs font-medium text-white"
                >
                  <span className="font-mono-tabular text-cyan-400 mr-1.5">
                    0{index + 1}.
                  </span>
                  {member}
                </li>
              ))}
            </ol>
          </div>

          {/* 6 Devices Placement Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              6 Perangkat Terpasang di Ruang Operator & Zona Gate A12
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(DEVICE_SPECS) as DeviceId[]).map((id, idx) => {
                const dev = DEVICE_SPECS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onSelectDevice(id);
                      onClose();
                    }}
                    className="text-left p-3 rounded-lg bg-[#141B29]/70 border border-slate-800 hover:border-cyan-400/50 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-cyan-300">
                      0{idx + 1}. {dev.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {dev.locationLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Gunakan klik kiri & seret untuk memutar kamera, scroll untuk zoom, klik kanan untuk pan, serta klik bagian komponen 3D mana pun untuk membedah struktur internal dan mensimulasikan skenario pengumuman maupun alarm.
          </div>
        </div>
      </div>
    </div>
  );
};
