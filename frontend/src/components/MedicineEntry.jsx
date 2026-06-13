import { addDays, format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { medicineService } from '../services/medicineService';
import './MedicineEntry.css';

const COMMON_DRUGS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Azithromycin',
  'Cetirizine',
  'Omeprazole',
  'Pantoprazole',
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Aspirin',
  'Diclofenac',
  'Ciprofloxacin',
  'Doxycycline',
  'Levofloxacin',
  'Azlocillin',
  'Cefixime',
  'Clindamycin',
  'Metronidazole',
  'Tinidazole',
];

export default function MedicineEntry({
  onAdd,
  frequencyOptions,
  dosageOptions,
}) {
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState(dosageOptions?.[0] || '500mg');
  const [frequency, setFrequency] = useState(
    typeof frequencyOptions?.[0] === 'object' && frequencyOptions[0]?.value
      ? frequencyOptions[0].value
      : frequencyOptions?.[0] || '1-0-1'
  );
  const [numberOfDays, setNumberOfDays] = useState('5');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [instructions, setInstructions] = useState('');

  const [drugOptions, setDrugOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [dosageOptionsRemote, setDosageOptionsRemote] = useState([]);

  const [selectedDrugId, setSelectedDrugId] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedDosageId, setSelectedDosageId] = useState(null);

  const drugInputRef = useRef(null);

  const calculateQuantity = () => {
    const days = parseInt(numberOfDays) || 0;
    const freqCount = frequency
      .split('-')
      .reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    return days * freqCount;
  };

  useEffect(() => {
    // load common types once
    (async () => {
      try {
        const types = await medicineService.listTypes();
        setTypeOptions(types || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    // when drug or type changes, load brands
    (async () => {
      try {
        if (!selectedDrugId) {
          setBrandOptions([]);
          setDosageOptionsRemote([]);
          return;
        }
        const brands = await medicineService.listBrands({
          drug_id: selectedDrugId,
          type_id: selectedTypeId,
        });
        setBrandOptions(brands || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedDrugId, selectedTypeId]);

  useEffect(() => {
    // when brand changes, load dosages
    (async () => {
      try {
        if (!selectedBrandId) {
          setDosageOptionsRemote([]);
          return;
        }
        const doses = await medicineService.listDosages({
          brand_id: selectedBrandId,
        });
        setDosageOptionsRemote(doses || []);
        // if the first dosage has default_instruction, prefill
        if (doses && doses.length > 0 && doses[0].default_instruction) {
          setInstructions(doses[0].default_instruction);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedBrandId]);

  const calculateEndDate = () => {
    const days = parseInt(numberOfDays) || 0;
    if (days <= 0) return startDate;
    return format(addDays(new Date(startDate), days - 1), 'yyyy-MM-dd');
  };

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    if (!drugName.trim()) return;

    onAdd({
      drug_name: drugName.trim(),
      drug_id: selectedDrugId,
      type_id: selectedTypeId,
      brand_id: selectedBrandId,
      dosage: dosage,
      dosage_id: selectedDosageId,
      frequency,
      instructions: instructions.trim() || null,
      start_date: startDate,
      number_of_days: parseInt(numberOfDays) || 1,
      end_date: calculateEndDate(),
      quantity: calculateQuantity(),
    });

    // Reset drug name and instructions but keep other settings for quick repetitive entry
    setDrugName('');
    setInstructions('');
    // Focus back on drug name
    drugInputRef.current?.focus();
  };

  return (
    <div className="medicine-entry-container">
      <div className="medicine-entry-table-header">
        <div className="col-drug">Drug Name</div>
        <div className="col-dosage">Dosage</div>
        <div className="col-freq">Frequency</div>
        <div className="col-days">Days</div>
        <div className="col-qty">Qty</div>
        <div className="col-instructions">Instructions</div>
        <div className="col-action"></div>
      </div>

      <form className="medicine-entry-row" onSubmit={handleAdd}>
        <div className="col-drug grid-drug-row">
          <div className="drug-input-wrap">
            <input
              id="drug-input-field"
              ref={drugInputRef}
              type="text"
              value={drugName}
              onChange={async (e) => {
                const v = e.target.value;
                setDrugName(v);
                // fetch suggestions
                try {
                  const res = await medicineService.searchDrugs(v);
                  setDrugOptions(res || []);
                  // if exact match, set selectedDrugId
                  const exact = (res || []).find(
                    (r) => r.name.toLowerCase() === v.toLowerCase()
                  );
                  setSelectedDrugId(exact ? exact.id : null);
                } catch (err) {
                  // ignore
                }
              }}
              placeholder="Search drug..."
              list="drug-suggestions"
              autoComplete="off"
            />
            <datalist id="drug-suggestions">
              {drugOptions.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </div>

          <select
            className="type-select"
            value={selectedTypeId || ''}
            onChange={(e) =>
              setSelectedTypeId(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            title="Select Type"
          >
            <option value="">Type</option>
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-dosage brand-dosage-col">
          <select
            className="brand-select"
            value={selectedBrandId || ''}
            onChange={(e) =>
              setSelectedBrandId(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
          >
            <option value="">Brand</option>
            {brandOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            className="dosage-select"
            value={dosage}
            onChange={(e) => {
              const val = e.target.value;
              setDosage(val);
              const found = (dosageOptionsRemote || []).find(
                (d) => d.label === val
              );
              setSelectedDosageId(found ? found.id : null);
              if (found && found.default_instruction)
                setInstructions(found.default_instruction);
            }}
          >
            <option value="">Dosage</option>
            {dosageOptionsRemote.length > 0
              ? dosageOptionsRemote.map((d) => (
                  <option key={d.id} value={d.label}>
                    {d.label}
                  </option>
                ))
              : (dosageOptions || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
          </select>
        </div>

        <div className="col-freq">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {(frequencyOptions || []).map((opt) => {
              const val =
                typeof opt === 'object' && opt != null && 'value' in opt
                  ? opt.value
                  : opt;
              const lab =
                typeof opt === 'object' && opt != null && 'label' in opt
                  ? opt.label
                  : opt;
              return (
                <option key={val} value={val}>
                  {lab}
                </option>
              );
            })}
          </select>
        </div>

        <div className="col-days">
          <input
            type="number"
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(e.target.value)}
            min="1"
            className="center-text"
          />
        </div>

        <div className="col-qty">
          <span className="qty-badge">{calculateQuantity()}</span>
        </div>

        <div className="col-instructions">
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="After food..."
            className="instructions-input"
          />
        </div>

        <div className="col-action">
          <button type="submit" className="btn-add-row" title="Add to list">
            +
          </button>
        </div>
      </form>

      {drugName && (
        <div className="entry-summary-hint">
          End Date: {format(new Date(calculateEndDate()), 'dd MMM yyyy')}
        </div>
      )}
    </div>
  );
}
