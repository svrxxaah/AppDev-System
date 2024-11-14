const Appointment = require('../models/appointment');
const sendEmail = require('../utils/mailer');

// Show all appointments
async function showAppointments(req, res) {
    try {
        const appointments = await Appointment.getAppointments(); // Now getAppointments() is defined
        res.render('appointment', { appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).send('Error fetching appointments');
    }
}

// Book a new appointment
async function bookAppointment(req, res) {
    const { patient_id, appointment_date } = req.body;
    try {
        const appointmentId = await Appointment.createAppointment(patient_id, appointment_date);

        // Get patient's email (You might need a method to get patient details)
        const patientEmail = await Appointment.getPatientEmail(patient_id);

        // Send booking confirmation email
        await sendEmail(patientEmail, 'Appointment Confirmation', `Your appointment has been successfully booked for ${appointment_date}.`);

        res.redirect('/appointment'); // Redirect to the appointments page
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).send('Error booking appointment');
    }
}

// Reschedule an appointment
async function rescheduleAppointment(req, res) {
    const { appointment_id, new_date } = req.body;
    try {
        await Appointment.rescheduleAppointment(appointment_id, new_date);

        // Get patient's email for reschedule notification
        const appointmentDetails = await Appointment.getAppointmentDetails(appointment_id);
        const patientEmail = await Appointment.getPatientEmail(appointmentDetails.patient_id);

        // Send reschedule email
        await sendEmail(patientEmail, 'Appointment Rescheduled', `Your appointment has been rescheduled to ${new_date}.`);

        res.redirect('/appointment'); // Redirect to appointments page
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        res.status(500).send('Error rescheduling appointment');
    }
}

// Cancel an appointment
async function cancelAppointment(req, res) {
    const { appointment_id } = req.body;
    try {
        // Validate if appointment_id is provided
        if (!appointment_id) {
            return res.status(400).json({ error: 'Appointment ID is required' });
        }

        // Fetch appointment details (and patient_id) using appointment_id
        const appointment = await Appointment.getAppointmentDetails(appointment_id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const patient_id = appointment.patient_id; // Ensure this field is correct

        // Proceed with canceling the appointment
        await Appointment.cancelAppointment(appointment_id);

        // Fetch patient's email for the cancellation notification
        const patientEmail = await Appointment.getPatientEmail(patient_id);

        // Send email notification (optional, if you want to notify the patient)
        await sendEmail(patientEmail, 'Appointment Canceled', 'Your appointment has been canceled.');

        // Respond with success message
        res.status(200).json({
            message: 'Appointment canceled successfully',
            patientEmail: patientEmail, // Optionally send the email to confirm
        });

    } catch (error) {
        console.error('Error canceling appointment:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    showAppointments,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment
};
