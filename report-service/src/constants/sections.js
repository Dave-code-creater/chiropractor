const INITIAL_REPORT_SECTIONS = [
    {
        id: "1",
        title: "Patient Intake Form",
        questions: [
            {
                id: "patientName",
                label: "Patient Name",
                type: "group",
                fields: [
                    { id: "firstName", label: "First", type: "text", placeholder: "John" },
                    { id: "middleName", label: "Middle", type: "text", placeholder: "A." },
                    { id: "lastName", label: "Last", type: "text", placeholder: "Doe" }
                ]
            },
            { id: "ssn", label: "SSN", type: "text", placeholder: "123-45-6789" },
            {
                id: "dobGender",
                label: "Date of Birth, Age & Gender",
                type: "group",
                fields: [
                    {
                        id: "dob",
                        label: "Date of Birth",
                        type: "date",
                        extra_info: "Select your birth date"
                    },
                    {
                        id: "age",
                        label: "Age",
                        type: "number",
                        calculated: true,
                        extra_info: "Age will be automatically calculated from the date of birth."
                    },
                    {
                        id: "gender",
                        label: "Gender",
                        type: "radio",
                        options: ["Male", "Female", "Others"],
                        extra_info: "Select the gender you most identify with."
                    }
                ]
            },
            {
                id: "statusNationality",
                label: "Marital Status & Nationality",
                type: "group",
                fields: [
                    {
                        id: "status",
                        label: "Status",
                        type: "radio",
                        options: ["Single", "Married", "Widowed", "Divorced"],
                        extra_info: "Choose your current marital status."
                    },
                    {
                        id: "race",
                        label: "Race/Ethnicity",
                        type: "radio",
                        options: ["Asian", "Black", "Caucasian", "Hispanic", "Other"],
                        extra_info: "Select the ethnicity or race you most closely identify with."
                    }
                ]
            },
            {
                id: "homeAddress",
                label: "Home Address",
                type: "group",
                fields: [
                    { id: "street", label: "Street", type: "text", placeholder: "123 Main St" },
                    { id: "city", label: "City", type: "text", placeholder: "Toronto" },
                    { id: "state", label: "State", type: "text", placeholder: "ON" },
                    { id: "zip", label: "Zip", type: "text", placeholder: "M4B 1B3" },
                    {
                        id: "homePhone",
                        label: "Home Phone",
                        type: "tel",
                        placeholder: "(123) 456-7890",
                        extra_info: "Include area code. Example: (123) 456-7890."
                    }
                ]
            },
            {
                id: "employmentInfo",
                label: "Employment & Occupation",
                type: "group",
                fields: [
                    { id: "employer", label: "Patient Employed By", type: "text", placeholder: "ABC Corp" },
                    { id: "occupation", label: "Occupation", type: "text", placeholder: "Software Engineer" },
                    { id: "workAddress", label: "Work Address", type: "text", placeholder: "456 Business Rd" },
                    {
                        id: "workPhone",
                        label: "Work Phone",
                        type: "tel",
                        placeholder: "(234) 567-8901",
                        extra_info: "Include area code. If none, leave blank."
                    }
                ]
            },
            {
                id: "spouseInfo",
                label: "Spouse Information",
                type: "group",
                fields: [
                    { id: "spouseFirst", label: "First", type: "text", placeholder: "Jane" },
                    { id: "spouseMiddle", label: "Middle", type: "text", placeholder: "B." },
                    { id: "spouseLast", label: "Last", type: "text", placeholder: "Smith" },
                    { id: "spouseSSN", label: "SSN", type: "text", placeholder: "987-65-4321" },
                    { id: "spouseEmployer", label: "Employed By", type: "text", placeholder: "XYZ Inc" },
                    {
                        id: "spousePhone",
                        label: "Phone",
                        type: "tel",
                        placeholder: "(345) 678-9012",
                        extra_info: "Include area code if known."
                    }
                ]
            },
            {
                id: "emergencyContacts",
                label: "Emergency Contacts",
                type: "group",
                fields: [
                    {
                        id: "contact1",
                        label: "Contact Person Name",
                        type: "text",
                        placeholder: "John Doe",
                        extra_info: "Include full name of the contact person."
                    },
                    {
                        id: "contact1Phone",
                        label: "Phone",
                        type: "tel",
                        placeholder: "(456) 789-0123",
                        extra_info: "Include area code. Example: (123) 456-7890."
                    },
                    {
                        id: "contact1Relationship",
                        label: "Relationship",
                        type: "radio",
                        options: ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"],
                        extra_info: "Select the relationship of the contact person to you."
                    }
                ],
                extra_info: "Include full name, relationship, and phone number. You may list more than one contact."
            }
        ]
    },
    {
        id: "2",
        title: "Accident & Insurance Details",
        questions: [
            {
                id: "mainComplaints",
                label: "What are your main problems (complaints / pains)?",
                type: "textarea"
            },
            {
                id: "previousHealthcare",
                label: "What other health care have you received for this problem(s)?",
                type: "textarea"
            },
            {
                id: "accidentDetails",
                label: "Accident or Illness Details",
                type: "group",
                fields: [
                    {
                        id: "typeCar",
                        label: "Type of Your Car",
                        type: "textArea",
                        extra_info: "If applicable, please provide the make and model of your vehicle."
                    },
                    {
                        id: "accidentDate",
                        label: "Date of Accident / Beginning of Illness",
                        type: "text",
                        placeholder: "08/15/2025",
                        extra_info: "Use MM/DD/YYYY format."
                    },
                    {
                        id: "accidentTime",
                        label: "Time",
                        type: "text",
                        placeholder: "14:30",
                        extra_info: "Include exact or approximate time of the event."
                    },
                    {
                        id: "accidentTimePeriod",
                        label: "AM / PM",
                        type: "radio",
                        options: ["AM", "PM"]
                    },
                    {
                        id: "accidentLocation",
                        label: "Location of Accident",
                        type: "text",
                        placeholder: "Downtown Toronto",
                        extra_info: "Provide the city, address, or general location where the accident occurred."
                    },
                    {
                        id: "accidentType",
                        label: "How did it occur?",
                        type: "radio",
                        options: ["Auto Collision", "On the job", "Other"],
                        extra_info: "Select the option that best describes how the injury occurred."
                    },
                    {
                        id: "accidentDescription",
                        label: "Please describe the circumstances",
                        type: "textarea",
                        extra_info: "Describe what happened in your own words. Be as specific as possible."
                    },
                    {
                        id: "accidentAwareness",
                        label: "Were you aware of the accident at the time it occurred?",
                        type: "radio",
                        options: ["Yes", "No"]
                    },
                    {
                        id: "acciddentAppearanceOfAmbulance",
                        label: "Did an ambulance appear at the scene?",
                        type: "textarea",
                        extra_info: "If yes, please describe the circumstances."
                    },
                    {
                        id: "AirbagDeployment",
                        label: "Did the airbag deploy?",
                        type: "radio",
                        options: ["Yes", "No"]
                    },
                    {
                        id: "seatbeltUse",
                        label: "Were you wearing a seatbelt?",
                        type: "radio",
                        options: ["Yes", "No"]
                    },
                    {
                        id: "PoliceAppearance",
                        label: "Did the police appear at the scene?",
                        type: "radio",
                        options: ["Yes", "No"]
                    },
                    {
                        id: "anyPastAccidents",
                        label: "Have you had any past accidents?",
                        type: "textarea",
                        extra_info: "If yes, please describe the health circumstances of each accident till now."
                    }
                ]
            },
            {
                id: "lostWork",
                label: "Have you lost time from work?",
                type: "group",
                fields: [
                    {
                        id: "lostWorkYesNo",
                        label: "Lost Time",
                        type: "radio",
                        options: ["Yes", "No"]
                    },
                    {
                        id: "lostWorkDates",
                        label: "Dates",
                        type: "text",
                        placeholder: "Jan 1–Jan 10",
                        extra_info: "Indicate the dates you missed work, if applicable. Example: Jan 1–Jan 10."
                    }
                ]
            },
            {
                id: "femaleOnly",
                label: "Female Specific",
                type: "group",
                fields: [
                    {
                        id: "pregnant",
                        label: "Are you pregnant?",
                        type: "radio",
                        options: ["Yes", "No"],
                        extra_info: "Only answer if applicable."
                    },
                    {
                        id: "childrenInfo",
                        label: "Number & Ages of Children",
                        type: "text",
                        placeholder: "2 (ages 5, 3)"
                    }
                ]
            },
            {
                id: "insuranceCoverage",
                label: "Is this case covered by insurance?",
                type: "group",
                fields: [
                    {
                        id: "covered",
                        label: "Covered by Insurance",
                        type: "radio",
                        options: ["Yes", "No"]
                    },
                    {
                        id: "insuranceType",
                        label: "Type of Insurance",
                        type: "radio",
                        options: [
                            "Group Insurance",
                            "Blue Cross / Blue Shield",
                            "Worker’s Compensation",
                            "Auto Insurance",
                            "Medicare",
                            "Personal Injury",
                            "Other Insurance"
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: "3",
        title: "Pain & Symptom Evaluation",
        questions: [
            {
                id: "painChart",
                label: "Where do you feel pain?",
                type: "image-map",
                extra_info:
                    "Click on the parts of the body that hurt. You can select multiple areas by clicking them one by one."
            }
        ]
    },
    {
        id: "4",
        title: "Detailed Symptom Description",
        questions: [
            {
                id: "symptomDetails",
                label:
                    "Please describe your symptoms, history, and onset as best you can.",
                type: "textarea",
                extra_info:
                    "Include when your symptoms began, how they have changed, and any previous treatments."
            }
        ]
    },
    {
        id: "5",
        title: "Recovery and Work Impact",
        questions: [
            {
                id: "workActivities",
                label:
                    "Please describe your work activities and how your condition affects them.",
                type: "checkbox",
                options: [
                    "Standing",
                    "Sitting",
                    "Walking",
                    "Driving",
                    "Typing",
                    "Lifting",
                    "Bending",
                    "Twisting",
                    "Stooping",
                    "Operating Equipment",
                    "Other"
                ],
                extra_info:
                    "Select the activities that are part of your work and are currently affected by your condition."
            }
        ]
    },
    {
        id: "6",
        title: "Extended Health History",
        questions: [
            {
                id: "pastMedicalHistory",
                label: "Past Medical History",
                type: "group",
                fields: [
                    {
                        id: "hasMedicalCondition",
                        label: "Do you have any past medical conditions?",
                        type: "radio",
                        options: [
                            "No major medical history",
                            "Yes, I do have a past medical condition(s)"
                        ]
                    },
                    {
                        id: "medicalConditionDetails",
                        label: "Describe your past medical condition(s)",
                        type: "textarea"
                    }
                ]
            },
            {
                id: "pastSurgicalHistory",
                label: "Past Surgical History",
                type: "group",
                fields: [
                    {
                        id: "hasSurgicalHistory",
                        label: "Do you have any past surgical history?",
                        type: "radio",
                        options: [
                            "No major surgical history",
                            "Yes, I do have a past surgical history"
                        ]
                    },
                    {
                        id: "surgicalHistoryDetails",
                        label: "Explain your surgical history",
                        type: "textarea"
                    }
                ]
            },
            {
                id: "medication",
                label: "Medication",
                type: "group",
                fields: [
                    {
                        id: "isTakingMedication",
                        label: "Are you currently taking any medication?",
                        type: "radio",
                        options: [
                            "Not taking any medications",
                            "Yes, I am currently taking a medication"
                        ]
                    },
                    {
                        id: "medicationNames",
                        label: "Name of medication(s)",
                        type: "textarea"
                    }
                ]
            },
            {
                id: "familyHistory",
                label: "Family History",
                type: "custom-table",
                columns: [
                    "Relative",
                    "Age if Living",
                    "Age at Death",
                    "Cause of Death",
                    "Illnesses"
                ],
                rows: ["Father", "Mother", "Brother(s)", "Sister(s)"],
                extra_info: "Please fill in as much as you can about your immediate family."
            },
            {
                id: "socialHistory",
                label: "Social History",
                type: "group",
                fields: [
                    { id: "currentWeight", label: "Current Weight", type: "text", placeholder: "70 kg" },
                    { id: "recentWeightChange", label: "Weight Change", type: "text", placeholder: "Lost 2 kg" },
                    {
                        id: "mentalWork",
                        label: "Mental work level",
                        type: "radio",
                        options: ["Heavy", "Moderate", "Light"]
                    },
                    { id: "mentalWorkHours", label: "Mental work hours/day", type: "text", placeholder: "8" },
                    {
                        id: "physicalWork",
                        label: "Physical work level",
                        type: "radio",
                        options: ["Heavy", "Moderate", "Light"]
                    },
                    { id: "physicalWorkHours", label: "Physical work hours/day", type: "text", placeholder: "4" },
                    {
                        id: "exercise",
                        label: "Exercise level",
                        type: "radio",
                        options: ["Heavy", "Moderate", "Light"]
                    },
                    { id: "exerciseHours", label: "Exercise hours/day", type: "text", placeholder: "1" },
                    {
                        id: "smokingStatus",
                        label: "Smoking status",
                        type: "radio",
                        options: ["Current", "Previous"]
                    },
                    { id: "packsPerDay", label: "Packs per day", type: "text", placeholder: "0" },
                    { id: "smokingYears", label: "Years smoking", type: "text", placeholder: "0" },
                    { id: "beerPerWeek", label: "Beer per week", type: "text", placeholder: "3" },
                    { id: "liquorPerWeek", label: "Liquor per week", type: "text", placeholder: "1" },
                    { id: "winePerWeek", label: "Wine per week", type: "text", placeholder: "0" },
                    { id: "alcoholYears", label: "Years drinking", type: "text", placeholder: "5" }
                ]
            },
            {
                id: "occupationalHistory",
                label: "Occupational History",
                type: "group",
                fields: [
                    {
                        id: "currentlyWorking",
                        label: "Are you currently working?",
                        type: "radio",
                        options: ["YES", "NO"]
                    },
                    {
                        id: "workTimes",
                        label: "Work Times",
                        type: "radio",
                        options: ["Full Time", "Part Time"]
                    },
                    { id: "workHoursPerDay", label: "Hours per day", type: "text", placeholder: "8" },
                    { id: "workDaysPerWeek", label: "Days per week", type: "text", placeholder: "5" },
                    {
                        id: "jobDescription",
                        label: "Describe your present job requirements",
                        type: "textarea"
                    }
                ]
            },
            {
                id: "femaleOnlyDetails",
                label: "Female Specific",
                type: "group",
                fields: [
                    {
                        id: "lastMenstrualPeriod",
                        label: "When was your last menstrual period?",
                        type: "text",
                        placeholder: "4 weeks ago",
                        extra_info: "Weeks ago"
                    },
                    {
                        id: "isPregnantNow",
                        label: "Are you or could you be pregnant?",
                        type: "radio",
                        options: ["YES", "NO"]
                    },
                    {
                        id: "weeksPregnant",
                        label: "If yes, number of weeks",
                        type: "text",
                        placeholder: "12"
                    }
                ]
            }
        ]
    }
];

module.exports = INITIAL_REPORT_SECTIONS;
