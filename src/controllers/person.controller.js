import Person from '../models/Person';
import PersonType from '../models/PersonType';
import { sequelize } from '../database/database';
import { returnNotFound, returnError } from './errors';

// Create a person
export async function createPerson(req, res) {
    const {
        dni,
        birthdate,
        names,
        lastNames,
        details,
        bio,
        image,
        personTypeID
    } = req.body;
    try {
        let newPerson = await Person.create({
            dni,
            birthdate,
            names,
            lastNames,
            completeName: names + ' ' + lastNames,
            details,
            bio,
            image,
            personTypeID
        }, {
            fields: ['dni', 'birthdate', 'names', 'lastNames', 'completeName', 'image', 'details', 'bio', 'personTypeID'],
            returning: ['personID', 'dni', 'birthdate', 'names', 'lastNames', 'completeName', 'image', 'details', 'bio', 'isActive', 'registeredDate', 'unregisteredDate', 'votes', 'personTypeID']
        });
        if (newPerson) {
            return res.status(200).json({
                ok: true,
                message: 'Person created successfully',
                newPerson
            });
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Create Person');
    }
}

// Get all people
export async function getPeople(req, res) {
    try {
        const people = await Person.findAndCountAll({
            attributes: ['personID', 'names', 'lastNames', 'completeName', 'birthdate', 'isActive', 'registeredDate', 'image', 'details', 'bio', 'votes', 'unregisteredDate', 'personTypeID']
        });
        if (people.count > 0) {
            return res.status(200).json({
                ok: true,
                people
            });
        } else {
            returnNotFound(res, 'All People');
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Get People');
    }
}

// Get only active people
export async function getActivePeople(req, res) {
    try {
        const people = await Person.findAndCountAll({
            attributes: ['personID', 'names', 'lastNames', 'completeName', 'birthdate', 'isActive', 'registeredDate', 'image', 'details', 'bio', 'votes', 'unregisteredDate', 'personTypeID'],
            where: {
                isActive: true
            }
        });
        if (people.count > 0) {
            return res.status(200).json({
                ok: true,
                people
            });
        } else {
            returnNotFound(res, 'Active People');
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Get Active People');
    }
}

// Get all inactive people
export async function getInactivePeople(req, res) {
    try {
        const people = await Person.findAndCountAll({
            attributes: ['personID', 'names', 'lastNames', 'completeName', 'birthdate', 'isActive', 'registeredDate', 'image', 'details', 'bio', 'votes', 'unregisteredDate', 'personTypeID'],
            where: {
                isActive: false
            }
        });
        if (people.count > 0) {
            return res.status(200).json({
                ok: true,
                people
            });
        } else {
            returnNotFound(res, 'Inacctive People');
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Get Inactive People');
    }
}

// Get all active people with people type description
export async function getActivePeopleType(req, res) {
    /*try {
        const people = await Person.findAndCountAll({
            attributes: ['personID', 'names', 'lastNames', 'completeName', 'birthdate', 'isActive', 'registeredDate', 'image', 'details', 'bio', 'votes', 'unregisteredDate', 'personTypeID'],
            where: {
                isActive: true
            },
            include: [{
                model: PersonType,
                attributes: ['personTypeID', 'typeName', 'personType']
            }]
        });
        if (people.count > 0) {
            return res.status(200).json({
                ok: true,
                people
            });
        } else {
            returnNotFound(res, 'Active People');
        }
    }*/
    try {
        const people = await sequelize.query(`
                SELECT "person"."completeName",  "person"."isActive", "person"."birthdate", "person"."bio", "personType"."typeName"
                FROM "person", "personType" 
                WHERE "person"."personTypeID" = "personType"."personTypeID"
                    AND "person"."isActive" = true`);

        if (people) {
            return res.status(200).json({
                ok: true,
                people
            });
        } else {
            returnNotFound(res, 'Active with Type');
        }
    } catch (e) {
        console.log('Error:', e);
        return res.status(500).json({ error: e });
        //returnError(res, e, 'Get Active People');
    }
}

// Update a Person providing personID
export async function updatePerson(req, res) {
    const { personID } = req.params;
    const {
        dni,
        names,
        lastNames,
        birthdate,
        image,
        details,
        bio,
        personTypeID
    } = req.body;
    try {
        const dbPerson = await Person.findOne({
            attributes: ['dni', 'names', 'lastNames', 'completeName', 'image', 'birthdate', 'details', 'bio', 'personTypeID'],
            where: {
                personID
            }
        });
        if (dbPerson) {
            const updatedPerson = await Person.update({
                dni,
                names,
                lastNames,
                completeName: names + '  ' + lastNames,
                birthdate,
                details,
                bio,
                image,
                personTypeID
            }, {
                where: {
                    personID
                }
            });
            if (updatedPerson) {
                return res.status(200).json({
                    ok: true,
                    message: 'Person updated successfully',
                    count: updatedPerson
                })
            } else {
                returnNotFound(res, 'Person ID');
            }
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, "Update Person");
    }
}

// Inactivate a person
export async function inactivatePerson(req, res) {
    const { personID } = req.params;
    const isActive = false;
    try {
        const dbPerson = await Person.findOne({
            attributes: ['dni', 'completeName', 'birthdate', 'isActive', 'image', 'bio', 'details'],
            where: {
                personID
            }
        });
        if (dbPerson) {
            const inactivatePerson = await Person.update({
                isActive,
                unregisteredDate: sequelize.fn('NOW')
            }, {
                where: {
                    personID,
                    isActive: true
                }
            });
            if (inactivatePerson > 0) {
                return res.status(200).json({
                    ok: true,
                    message: 'Person inactivated successfully'
                });
            } else {
                return res.status(400).json({
                    ok: false,
                    message: 'Error while inactivating a Person or Person already inactive',
                    error: 'Error 0'
                });
            }
        } else {
            returnNotFound(res, 'Active Person');
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Inactivate Person');
    }
}

// Inactivate a person
export async function activatePerson(req, res) {
    const { personID } = req.params;
    const isActive = true;
    try {
        const dbPerson = await Person.findOne({
            attributes: ['dni', 'completeName', 'birthdate', 'isActive', 'image', 'bio', 'details'],
            where: {
                personID
            }
        });
        if (dbPerson) {
            const inactivatePerson = await Person.update({
                isActive
            }, {
                where: {
                    personID,
                    isActive: false
                }
            });
            if (inactivatePerson > 0) {
                return res.status(200).json({
                    ok: true,
                    message: 'Person activated successfully'
                });
            } else {
                return res.status(400).json({
                    ok: false,
                    message: 'Error while activating a Person or Person already active',
                    error: 'Error 0'
                });
            }
        } else {
            returnNotFound(res, 'Inactive Person');
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Activate Person');
    }
}

// Delete a Person
export async function deletePerson(req, res) {
    const { personID } = req.params;
    try {
        const countDeleted = await Person.destroy({
            where: {
                personID
            }
        });
        if (countDeleted > 0) {
            return res.status(200).json({
                ok: true,
                message: 'Person deleted successfully'
            });
        } else {
            returnNotFound(res, 'Person ID');
        }
    } catch (e) {
        console.log('Error:', e);
        returnError(res, e, 'Delete Person');
    }
}