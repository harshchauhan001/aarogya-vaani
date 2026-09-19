import { OPDEncounter } from '../types';
import { CURRENT_HOSPITAL } from '../data/hospitals';

export function generateAbdmFhirBundle(encounter: OPDEncounter) {
  const { patient, vitals, history, soapNote } = encounter;
  const now = new Date().toISOString();
  const bundleId = `abdm-bundle-${encounter.id}-${Date.now()}`;

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: now,
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClinicalArtifactBundle',
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord',
      ],
      security: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
          code: 'R',
          display: 'Restricted',
        },
      ],
    },
    identifier: {
      system: 'https://ndhm.gov.in/bundles',
      value: bundleId,
    },
    type: 'document',
    timestamp: now,
    entry: [
      {
        fullUrl: `urn:uuid:composition-${encounter.id}`,
        resource: {
          resourceType: 'Composition',
          id: `composition-${encounter.id}`,
          status: 'final',
          type: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '371530004',
                display: 'Clinical consultation report',
              },
            ],
            text: 'AarogyaVaani AI Pre-Consultation History Note',
          },
          subject: {
            reference: `urn:uuid:patient-${patient.id}`,
            display: patient.name,
          },
          date: now,
          author: [
            {
              display: encounter.doctorName || `Consultant Physician, ${encounter.hospitalName || CURRENT_HOSPITAL.name}`,
            },
          ],
          title: `OPD Clinical Consultation Note - Token #${encounter.tokenNumber}`,
          section: [
            {
              title: 'Chief Complaints & History of Present Illness',
              code: {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '422843007',
                    display: 'Chief complaint section',
                  },
                ],
              },
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Complaint:</b> ${history.hpi.chiefComplaint}</p><p><b>Duration:</b> ${history.hpi.durationNumber} ${history.hpi.durationUnit}</p><p><b>Severity:</b> ${history.hpi.severity}/10</p><p><b>Vernacular Statement:</b> ${history.hpi.vernacularVoiceTranscript || 'N/A'}</p></div>`,
              },
            },
            {
              title: 'Triage Assessment & Red Flags',
              code: {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '225390008',
                    display: 'Triage assessment',
                  },
                ],
              },
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Level:</b> ${encounter.triage.level}</p><p><b>Red Flags:</b> ${encounter.triage.redFlagsDetected.join('; ') || 'None'}</p></div>`,
              },
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:patient-${patient.id}`,
        resource: {
          resourceType: 'Patient',
          id: `patient-${patient.id}`,
          identifier: [
            {
              type: {
                coding: [
                  {
                    system: 'https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code',
                    code: 'ABHA',
                    display: 'Ayushman Bharat Health Account',
                  },
                ],
              },
              system: 'https://healthid.ndhm.gov.in',
              value: patient.abhaId,
            },
            {
              type: {
                coding: [
                  {
                    system: 'https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code',
                    code: 'UHID',
                    display: 'Unique Hospital Identifier',
                  },
                ],
              },
              system: `https://healthfacility.abdm.gov.in/facilities/${encounter.hospitalId || CURRENT_HOSPITAL.id}/uhid`,
              value: patient.uhid,
            },
          ],
          name: [
            {
              text: patient.name,
            },
          ],
          telecom: [
            {
              system: 'phone',
              value: patient.phone,
            },
          ],
          gender: patient.gender.toLowerCase(),
          address: [
            {
              city: patient.district,
              state: patient.state,
              country: 'IND',
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:obs-vitals-${encounter.id}`,
        resource: {
          resourceType: 'Observation',
          id: `obs-vitals-${encounter.id}`,
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '85353-1',
                display: 'Vital signs, weight, height, head circumference & oxygen saturation panel',
              },
            ],
          },
          component: [
            {
              code: { text: 'Systolic Blood Pressure' },
              valueQuantity: { value: vitals.bpSystolic, unit: 'mmHg' },
            },
            {
              code: { text: 'Diastolic Blood Pressure' },
              valueQuantity: { value: vitals.bpDiastolic, unit: 'mmHg' },
            },
            {
              code: { text: 'Pulse Rate' },
              valueQuantity: { value: vitals.pulseRate, unit: 'beats/min' },
            },
            {
              code: { text: 'SpO2' },
              valueQuantity: { value: vitals.spo2, unit: '%' },
            },
            {
              code: { text: 'Body Temperature' },
              valueQuantity: { value: vitals.temperature, unit: '°F' },
            },
          ],
        },
      },
      ...(soapNote?.icd10Codes || []).map((icd, idx) => ({
        fullUrl: `urn:uuid:condition-${idx}-${encounter.id}`,
        resource: {
          resourceType: 'Condition',
          id: `condition-${idx}-${encounter.id}`,
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
              },
            ],
          },
          code: {
            coding: [
              {
                system: 'http://hl7.org/fhir/sid/icd-10',
                code: icd.code,
                display: icd.name,
              },
            ],
            text: icd.name,
          },
          subject: {
            reference: `urn:uuid:patient-${patient.id}`,
          },
        },
      })),
    ],
  };
}
