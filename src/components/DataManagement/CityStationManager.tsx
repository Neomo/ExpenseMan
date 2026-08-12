import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CityStationRecord, RailwayStation } from '../../data/defaultCityStations';
import {
  Building2,
  Train,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Search,
  MapPin,
  X,
  Check,
  Globe,
} from 'lucide-react';

export const CityStationManager: React.FC = () => {
  const {
    cityStations,
    addCityStation,
    updateCityStation,
    deleteCityStation,
    addStationToCity,
    deleteStationFromCity,
    resetCityStationsToDefault,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Form States
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityStationRecord | null>(null);

  const [cityForm, setCityForm] = useState({
    cityName: '',
    province: '',
    cityLat: 30.0,
    cityLng: 114.0,
  });

  const [stationModalOpen, setStationModalOpen] = useState<string | null>(null); // cityId
  const [stationForm, setStationForm] = useState({
    name: '',
    lat: 30.0,
    lng: 114.0,
  });

  // Search Filter
  const filteredCityStations = cityStations.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchCity = item.cityName.toLowerCase().includes(q);
    const matchProv = item.province.toLowerCase().includes(q);
    const matchStation = item.stations.some((st) => st.name.toLowerCase().includes(q));
    return matchCity || matchProv || matchStation;
  });

  // Open Edit City Modal
  const handleOpenEditCity = (record: CityStationRecord) => {
    setEditingCity(record);
    setCityForm({
      cityName: record.cityName,
      province: record.province || '',
      cityLat: record.cityLat,
      cityLng: record.cityLng,
    });
    setCityModalOpen(true);
  };

  // Open Add City Modal
  const handleOpenAddCity = () => {
    setEditingCity(null);
    setCityForm({
      cityName: '',
      province: '',
      cityLat: 30.5928,
      cityLng: 114.3055,
    });
    setCityModalOpen(true);
  };

  // Save City Form
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.cityName.trim()) return;

    if (editingCity) {
      await updateCityStation(editingCity.id, {
        cityName: cityForm.cityName.trim(),
        province: cityForm.province.trim(),
        cityLat: Number(cityForm.cityLat),
        cityLng: Number(cityForm.cityLng),
      });
    } else {
      await addCityStation({
        cityName: cityForm.cityName.trim(),
        province: cityForm.province.trim(),
        cityLat: Number(cityForm.cityLat),
        cityLng: Number(cityForm.cityLng),
        stations: [],
      });
    }

    setCityModalOpen(false);
  };

  // Open Add Station Modal
  const handleOpenAddStation = (cityRecord: CityStationRecord) => {
    setStationModalOpen(cityRecord.id);
    setStationForm({
      name: `${cityRecord.cityName}站`,
      lat: cityRecord.cityLat,
      lng: cityRecord.cityLng,
    });
  };

  // Save Station Form
  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationModalOpen || !stationForm.name.trim()) return;

    await addStationToCity(stationModalOpen, {
      name: stationForm.name.trim(),
      lat: Number(stationForm.lat),
      lng: Number(stationForm.lng),
    });

    setStationModalOpen(null);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>城市与火车站关联数据库校准</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                共 {cityStations.length} 城市 / {cityStations.reduce((s, c) => s + c.stations.length, 0)} 车站
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              可在此自定义修正城市经纬度、关联火车站别名及映射关联，以精准渲染地图动线
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索城市或火车站..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAddCity}
            className="px-3.5 py-1.5 rounded-xl bg-[#52c488] hover:bg-[#3d9e6c] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all border-b-2 border-[#328359]"
          >
            <Plus className="w-4 h-4" />
            <span>新增城市</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('确认重置城市火车站数据库为标准预设记录？此操作将恢复全国主要城市车站配对。')) {
                resetCityStationsToDefault();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
            title="恢复默认库"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>恢复默认库</span>
          </button>
        </div>
      </div>

      {/* City & Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCityStations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            未检索到相关城市或火车站映射数据
          </div>
        ) : (
          filteredCityStations.map((item) => (
            <div
              key={`city-card-${item.id}`}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between space-y-3"
            >
              {/* City Top Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {item.cityName}
                    </span>
                    {item.province && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.province}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>
                      坐标: {item.cityLat.toFixed(4)}, {item.cityLng.toFixed(4)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCity(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                    title="编辑城市及坐标"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`确认删除城市「${item.cityName}」及旗下所有火车站映射？`)) {
                        deleteCityStation(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                    title="删除城市记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Station Badges List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Train className="w-3 h-3 text-emerald-600" />
                    <span>关联火车站 ({item.stations.length})</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenAddStation(item)}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>加火车站</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {item.stations.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">暂未配置具体火车站</span>
                  ) : (
                    item.stations.map((st) => (
                      <span
                        key={`st-badge-${st.id}`}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs group"
                      >
                        <span>🚉 {st.name}</span>
                        <button
                          type="button"
                          onClick={() => deleteStationFromCity(item.id, st.id)}
                          className="text-slate-300 group-hover:text-rose-500 transition-colors"
                          title="移除火车站"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit City Modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{editingCity ? '编辑城市数据库记录' : '新增城市与地理坐标'}</span>
              </h3>
              <button onClick={() => setCityModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCity} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  城市名称 (如：武汉、北京、广州)
                </label>
                <input
                  type="text"
                  required
                  value={cityForm.cityName}
                  onChange={(e) => setCityForm({ ...cityForm, cityName: e.target.value })}
                  placeholder="例如：武汉"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  所属省份 (可选)
                </label>
                <input
                  type="text"
                  value={cityForm.province}
                  onChange={(e) => setCityForm({ ...cityForm, province: e.target.value })}
                  placeholder="例如：湖北"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    纬度 Latitude (WGS84)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cityForm.cityLat}
                    onChange={(e) => setCityForm({ ...cityForm, cityLat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    经度 Longitude (WGS84)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cityForm.cityLng}
                    onChange={(e) => setCityForm({ ...cityForm, cityLng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#52c488] text-white font-bold shadow-xs border-b-2 border-[#32855b]"
                >
                  保存城市记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      {stationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Train className="w-5 h-5 text-emerald-600" />
                <span>新增火车站关联</span>
              </h3>
              <button onClick={() => setStationModalOpen(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  火车站全称 (如：汉口站、武汉站、北京西站)
                </label>
                <input
                  type="text"
                  required
                  value={stationForm.name}
                  onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                  placeholder="例如：汉口站"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    车站纬度 Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={stationForm.lat}
                    onChange={(e) => setStationForm({ ...stationForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    车站经度 Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={stationForm.lng}
                    onChange={(e) => setStationForm({ ...stationForm, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStationModalOpen(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#52c488] text-white font-bold shadow-xs border-b-2 border-[#32855b]"
                >
                  确认添加车站
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
