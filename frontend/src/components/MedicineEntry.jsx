import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import './MedicineEntry.css'

const COMMON_DRUGS = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Cetirizine',
  'Omeprazole', 'Pantoprazole', 'Metformin', 'Amlodipine', 'Atorvastatin',
  'Aspirin', 'Diclofenac', 'Ciprofloxacin', 'Doxycycline', 'Levofloxacin',
  'Azlocillin', 'Cefixime', 'Clindamycin', 'Metronidazole', 'Tinidazole'
]

export default function MedicineEntry({ onAdd, frequencyOptions, dosageOptions }) {
  const [drugName, setDrugName] = useState('')
  const [dosage, setDosage] = useState(dosageOptions?.[0] || '500mg')
  const [frequency, setFrequency] = useState(
    (typeof frequencyOptions?.[0] === 'object' && frequencyOptions[0]?.value) ? frequencyOptions[0].value : (frequencyOptions?.[0] || '1-0-1')
  )
  const [numberOfDays, setNumberOfDays] = useState('5')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [instructions, setInstructions] = useState('')

  const calculateQuantity = () => {
    const days = parseInt(numberOfDays) || 0
    const freqCount = frequency.split('-').reduce((sum, val) => sum + (parseInt(val) || 0), 0)
    return days * freqCount
  }

  const calculateEndDate = () => {
    const days = parseInt(numberOfDays) || 0
    if (days <= 0) return startDate
    return format(addDays(new Date(startDate), days - 1), 'yyyy-MM-dd')
  }

  const handleAdd = (e) => {
    if (e) e.preventDefault()
    if (!drugName.trim()) return

    onAdd({
      drug_name: drugName.trim(),
      dosage,
      frequency,
      instructions: instructions.trim() || null,
      start_date: startDate,
      number_of_days: parseInt(numberOfDays) || 1,
      end_date: calculateEndDate(),
      quantity: calculateQuantity()
    })

    // Reset drug name and instructions but keep other settings for quick repetitive entry
    setDrugName('')
    setInstructions('')
    // Focus back on drug name
    document.getElementById('drug-input-field')?.focus()
  }

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
        <div className="col-drug">
          <input
            id="drug-input-field"
            type="text"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            placeholder="Search drug..."
            list="drug-suggestions"
            autoComplete="off"
          />
          <datalist id="drug-suggestions">
            {COMMON_DRUGS.map(drug => (
              <option key={drug} value={drug} />
            ))}
          </datalist>
        </div>

        <div className="col-dosage">
          <select value={dosage} onChange={(e) => setDosage(e.target.value)}>
            {dosageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="col-freq">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {(frequencyOptions || []).map(opt => {
              const val = typeof opt === 'object' && opt != null && 'value' in opt ? opt.value : opt
              const lab = typeof opt === 'object' && opt != null && 'label' in opt ? opt.label : opt
              return <option key={val} value={val}>{lab}</option>
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
          <button type="submit" className="btn-add-row" title="Add to list">+</button>
        </div>
      </form>
      
      {drugName && (
        <div className="entry-summary-hint">
          End Date: {format(new Date(calculateEndDate()), 'dd MMM yyyy')}
        </div>
      )}
    </div>
  )
}
